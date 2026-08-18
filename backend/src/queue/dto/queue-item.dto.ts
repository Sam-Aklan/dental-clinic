import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../generated/prisma/enums';

export class QueueItemDto {
  @ApiProperty()
  appointmentId!: string;

  @ApiPropertyOptional({ nullable: true })
  position!: number | null;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  @ApiProperty({ format: 'date-time' })
  endsAt!: string;

  @ApiProperty()
  needsFollowUp!: boolean;
}

export type QueueSnapshotEvent = {
  doctorId: string;
  date: string;
  doctorDisplayName: string;
  items: QueueItemDto[];
};

export type QueueUpdatedEvent = {
  appointmentId: string;
  doctorId: string;
  status: AppointmentStatus;
  position: number | null;
  needsFollowUp: boolean;
  startsAt: string;
  endsAt: string;
  updatedAt: string;
};

export type QueueRemovedEvent = {
  appointmentId: string;
  doctorId: string;
};
