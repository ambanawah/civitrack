import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum Status {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export class UpdateStatusDto {
  @IsEnum(Status)
  status: Status;

  @IsString()
  @IsOptional()
  note?: string;
}
