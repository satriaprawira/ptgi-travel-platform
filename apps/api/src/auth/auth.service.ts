import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { UsersRepository, type AuthState } from '../users/users.repository.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { LoginThrottle } from './login-throttle.js';
import { hashPassword, verifyPassword } from './password.js';
import { signToken, TOKEN_TTL_SECONDS, type Role } from './token.js';

/** The signed-in user as the web app sees it (GET /auth/me and the sign-in response). */
export interface SessionUser {
  id: string | null;
  fullName: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  /** true only in local development with AUTH_DISABLED: nobody is signed in. */
  authDisabled: boolean;
}

export interface SignInResult {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const toSessionUser = (user: AuthState): SessionUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  authDisabled: false,
});

@Injectable()
export class AuthService {
  // Failed attempts: per account (guessing one password) and per IP address (trying many accounts).
  private readonly perEmail = new LoginThrottle(5, FIFTEEN_MINUTES);
  private readonly perIp = new LoginThrottle(20, FIFTEEN_MINUTES);
  private dummyHash?: Promise<string>;

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly users: UsersRepository,
  ) {}

  async login(dto: LoginDto, ip: string): Promise<SignInResult> {
    const secret = this.secret();
    const email = dto.email.trim().toLowerCase();
    const keys = [`email:${email}`, `ip:${ip}`];

    const wait = Math.max(this.perEmail.retryAfterSeconds(keys[0]), this.perIp.retryAfterSeconds(keys[1]));
    if (wait > 0) {
      throw new HttpException(
        `Too many sign-in attempts. Try again in ${Math.ceil(wait / 60)} minute${wait > 60 ? 's' : ''}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // An unknown email still costs one hash check, so the response time doesn't reveal which emails exist.
    const user = await this.users.findCredentialsByEmail(email);
    const matches = await verifyPassword(dto.password, user?.passwordHash ?? (await this.getDummyHash()));
    if (!user || !matches) {
      this.perEmail.recordFailure(keys[0]);
      this.perIp.recordFailure(keys[1]);
      throw new UnauthorizedException('Incorrect email or password');
    }
    this.perEmail.reset(keys[0]);
    if (user.status !== 'active') {
      throw new UnauthorizedException('This account is disabled. Ask an admin if you need access.');
    }

    await this.users.recordLogin(user.id);
    return this.signIn(user, secret);
  }

  /** Sets the user's own password. Ends their other sessions and returns a fresh token for this one. */
  async changePassword(user: AuthState, dto: ChangePasswordDto): Promise<SignInResult> {
    const secret = this.secret();
    const credentials = await this.users.findCredentialsById(user.id);
    // 422, not 401: a 401 would sign the user out in the web app.
    if (!credentials || !(await verifyPassword(dto.currentPassword, credentials.passwordHash))) {
      throw new UnprocessableEntityException('Your current password is not correct');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new UnprocessableEntityException('Choose a new password that is different from the current one');
    }
    const tokenVersion = await this.users.setPassword(user.id, await hashPassword(dto.newPassword), false);
    if (tokenVersion === null) throw new UnauthorizedException('Your session has ended. Please sign in again.');
    return this.signIn({ ...user, tokenVersion, mustChangePassword: false }, secret);
  }

  private signIn(user: AuthState, secret: string): SignInResult {
    const now = new Date();
    return {
      accessToken: signToken(user, secret, now),
      expiresAt: new Date(now.getTime() + TOKEN_TTL_SECONDS * 1000).toISOString(),
      user: toSessionUser(user),
    };
  }

  private secret(): string {
    const secret = this.config.get('AUTH_TOKEN_SECRET', { infer: true });
    if (!secret) throw new ServiceUnavailableException('Sign-in is not configured on this server');
    return secret;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
    return this.dummyHash;
  }
}
