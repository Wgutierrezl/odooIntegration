import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vat?: string;

  @IsOptional()
  @IsBoolean()
  is_company?: boolean;
}
