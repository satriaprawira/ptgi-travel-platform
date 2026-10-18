import { IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../password.js';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(200)
  currentPassword: string;

  // Length is the rule that matters (NIST 800-63B); no composition rules.
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: `The new password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: `The new password can be at most ${PASSWORD_MAX_LENGTH} characters` })
  newPassword: string;
}
