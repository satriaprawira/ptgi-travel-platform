import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { trim } from '../../common/transforms.js';
import { normalizeEmail, UserRole, UserStatus } from './create-user.dto.js';

// Every column is NOT NULL: fields may be omitted but not set to null (ValidateIf skips only `undefined`).
const present = (_: object, value: unknown) => value !== undefined;

export class UpdateUserDto {
  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName?: string;

  @ValidateIf(present)
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email must be an email address' })
  @MaxLength(200)
  email?: string;

  @ValidateIf(present)
  @IsEnum(UserRole)
  role?: UserRole;

  @ValidateIf(present)
  @IsEnum(UserStatus)
  status?: UserStatus;
}
