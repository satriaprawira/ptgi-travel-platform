import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
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

  /**
   * Signs the staff sign-in tokens. Long and random: `openssl rand -base64 48`. Without it, admin routes
   * stay locked (unless AUTH_DISABLED in local development). Changing it signs everyone out.
   */
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

  return env;
}
