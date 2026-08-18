import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, FollowUpStatus } from '../../generated/prisma/enums';

export class FollowUpResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty()
  patientName!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  appointmentId!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceAppointmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sourceAppointmentNeedsFollowUp!: boolean | null;

  @ApiProperty({ format: 'date-time' })
  followUpAt!: string;

  @ApiProperty({ format: 'date-time' })
  followUpEndsAt!: string;

  @ApiProperty()
  reason!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ enum: FollowUpStatus })
  status!: FollowUpStatus;

  @ApiProperty()
  scheduledById!: string;

  @ApiPropertyOptional({ nullable: true })
  cancellationReason!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: any): FollowUpResponseDto {
    return {
      id: record.id,
      patientId: record.patientUserId,
      patientName: `${record.patient.firstName} ${record.patient.lastName}`.trim(),
      doctorId: record.doctorProfileId,
      doctorName: `${record.doctorProfile.user.firstName} ${record.doctorProfile.user.lastName}`.trim(),
      appointmentId: record.appointmentId,
      sourceAppointmentId: record.sourceAppointmentId ?? null,
      sourceAppointmentNeedsFollowUp: record.sourceAppointment?.needsFollowUp ?? null,
      followUpAt: record.appointment.startTime.toISOString(),
      followUpEndsAt: record.appointment.endTime.toISOString(),
      reason: record.reason,
      notes: record.notes ?? null,
      status: record.status,
      scheduledById: record.scheduledById,
      cancellationReason: record.cancellationReason ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export class FollowUpPageResponseDto {
  @ApiProperty({ type: FollowUpResponseDto, isArray: true })
  items!: FollowUpResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export type FollowUpRecord = {
  id: string;
  appointmentId: string;
  sourceAppointmentId: string | null;
  patientUserId: string;
  doctorProfileId: string;
  scheduledById: string;
  status: FollowUpStatus;
  reason: string;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  appointment: { id: string; startTime: Date; endTime: Date; status: AppointmentStatus };
  patient: { id: string; firstName: string; lastName: string; preferredLocale: string };
  doctorProfile: { id: string; user: { firstName: string; lastName: string } };
  scheduledBy: { id: string; firstName: string; lastName: string };
  sourceAppointment: { id: string; needsFollowUp: boolean } | null;
};
