import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  work_email?: string;

  @IsOptional()
  @IsString()
  work_phone?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;
}
