import { plainToInstance, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, Matches, Max, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

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
