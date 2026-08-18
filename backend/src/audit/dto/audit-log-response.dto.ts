import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums';

export class AuditActorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ enum: Role })
  role!: Role;
}

export class AuditLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  actorId!: string | null;

  @ApiProperty({ type: () => AuditActorDto, nullable: true })
  actor!: AuditActorDto | null;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  targetType!: string;

  @ApiProperty({ nullable: true })
  targetId!: string | null;

  @ApiProperty({ type: 'object', nullable: true, additionalProperties: true })
  payload!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;
}
