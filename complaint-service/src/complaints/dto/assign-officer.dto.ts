import { IsString, IsNotEmpty } from 'class-validator';

export class AssignOfficerDto {
  @IsString()
  @IsNotEmpty()
  officerId: string;

  @IsString()
  @IsNotEmpty()
  officerName: string;
}
