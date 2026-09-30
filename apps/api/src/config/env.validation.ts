import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

// `KEY=` in a .env file arrives as "", which should mean "not set".
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @Matches(/^postgres(ql)?:\/\/.+/, {
    message: 'DATABASE_URL must start with postgres:// or postgresql://',
  })
  DATABASE_URL: string;

  @Matches(/^https?:\/\/[^/]+$/, {
    message: 'WEB_ORIGIN must be an origin such as http://localhost:3000 (no path, no trailing slash)',
  })
  WEB_ORIGIN: string;

  // A plain Boolean("false") is true, so the string is compared explicitly.
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  AUTH_DISABLED: boolean = false;

  // Demo admin login (until a real auth provider replaces it): one account, set here, never in the
  // web app. All three or none; without them, admin routes stay locked outside development.
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail({}, { message: 'DEMO_ADMIN_EMAIL must be an email address' })
  DEMO_ADMIN_EMAIL?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  DEMO_ADMIN_PASSWORD?: string;

  /** Signs the login tokens. Long and random: `openssl rand -base64 48`. */
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MinLength(32, { message: 'AUTH_TOKEN_SECRET must be at least 32 characters' })
  AUTH_TOKEN_SECRET?: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(env);

  if (errors.length > 0) {
    const problems = errors.flatMap((error) => Object.values(error.constraints ?? {}));
    throw new Error(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }

  // Fail closed: the admin auth bypass must never be active outside local development.
  if (env.AUTH_DISABLED && env.NODE_ENV !== NodeEnv.Development) {
    throw new Error(
      `Invalid environment configuration:\n  - AUTH_DISABLED=true is only allowed when NODE_ENV=development (NODE_ENV is "${env.NODE_ENV}")`,
    );
  }

  const demoVars = [env.DEMO_ADMIN_EMAIL, env.DEMO_ADMIN_PASSWORD, env.AUTH_TOKEN_SECRET];
  if (demoVars.some(Boolean) && !demoVars.every(Boolean)) {
    throw new Error(
      'Invalid environment configuration:\n  - DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD and AUTH_TOKEN_SECRET must be set together',
    );
  }
  if (env.NODE_ENV === NodeEnv.Production && env.DEMO_ADMIN_PASSWORD && env.DEMO_ADMIN_PASSWORD.length < 16) {
    throw new Error(
      'Invalid environment configuration:\n  - DEMO_ADMIN_PASSWORD must be at least 16 characters in production',
    );
  }

  return env;
}
