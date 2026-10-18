import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { generateTemporaryPassword, hashPassword } from '../auth/password.js';
import { DatabaseService } from '../database/database.service.js';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import { accessChangeProblem } from './admin-rules.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersRepository, type User } from './users.repository.js';

/** Returned once when an account is created or its password reset. Never stored in plain text. */
export interface UserWithTemporaryPassword {
  user: User;
  temporaryPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly users: UsersRepository,
  ) {}

  list(): Promise<User[]> {
    return this.users.list();
  }

  async get(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<UserWithTemporaryPassword> {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const id = await this.users
      .insert(this.db, { fullName: dto.fullName, email: dto.email, role: dto.role, passwordHash })
      .catch(translateWriteError);
    return { user: await this.get(id), temporaryPassword };
  }

  /** `actorId`: the admin making the change (null with AUTH_DISABLED). */
  async update(actorId: string | null, id: string, dto: UpdateUserDto): Promise<User> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update');
    }
    await this.db
      .transaction(async (client) => {
        await this.users.lockAdmins(client);
        const target = await this.users.lockUser(client, id);
        if (!target) throw new NotFoundException(`User ${id} not found`);

        const next = { role: dto.role ?? target.role, status: dto.status ?? target.status };
        const problem = accessChangeProblem({
          actorId,
          target: { id, ...target },
          next,
          otherActiveAdmins: await this.users.countOtherActiveAdmins(client, id),
        });
        if (problem) throw new ConflictException(problem);

        // Disabling signs the user out at once (the guard also checks the status). Re-enabling must
        // not bring their old sessions back, so any status change ends them.
        await this.users.update(client, id, dto, next.status !== target.status);
      })
      .catch(translateWriteError);
    return this.get(id);
  }

  /** A new temporary password: the user must change it at their next sign-in; their sessions end. */
  async resetPassword(actorId: string | null, id: string): Promise<UserWithTemporaryPassword> {
    if (id === actorId) {
      throw new ConflictException('Use "Change password" to change your own password');
    }
    const temporaryPassword = generateTemporaryPassword();
    const found = await this.users.setPassword(id, await hashPassword(temporaryPassword), true);
    if (found === null) throw new NotFoundException(`User ${id} not found`);
    return { user: await this.get(id), temporaryPassword };
  }
}

function translateWriteError(error: unknown): never {
  if (isPgError(error, PgErrorCode.UniqueViolation, 'users_email_key')) {
    throw new ConflictException('A user with this email already exists');
  }
  throw error;
}
