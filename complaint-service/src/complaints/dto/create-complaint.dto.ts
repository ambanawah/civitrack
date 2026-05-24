import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum Department {
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
  ROADS = 'ROADS',
  HEALTH = 'HEALTH',
  SANITATION = 'SANITATION',
  EDUCATION = 'EDUCATION',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

export class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @IsEnum(Department)
  @IsOptional()
  department?: Department; // optional — auto-detected if not provided
}
