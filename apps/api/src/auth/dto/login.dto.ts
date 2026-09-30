import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';
import { trim } from '../../common/transforms.js';

export class LoginDto {
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  email: string;

  @IsString()
  @MaxLength(200)
  password: string;
}
