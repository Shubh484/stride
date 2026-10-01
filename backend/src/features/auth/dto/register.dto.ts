import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 30, { message: 'Username must be between 3 and 30 characters' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, dashes, and dots',
  })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50, { message: 'Display name must be between 1 and 50 characters' })
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 72, { message: 'Password must be at least 8 characters long' })
  password!: string;
}
