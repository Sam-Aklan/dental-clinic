import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, Locale } from '../../generated/prisma/enums';

class AppointmentDoctorDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  firstName!: string;

  @ApiPropertyOptional()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  specialization!: string | null;
}

class AppointmentPatientDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;
}

export class AppointmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  @ApiProperty({ format: 'date-time' })
  endsAt!: string;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty()
  needsFollowUp!: boolean;

  @ApiPropertyOptional({ nullable: true })
  followUpId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancellationReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({ type: AppointmentDoctorDto })
  doctor!: AppointmentDoctorDto;

  @ApiProperty({ type: AppointmentPatientDto })
  patient!: AppointmentPatientDto;

  static fromRecord(record: AppointmentRecord): AppointmentResponseDto {
    return {
      id: record.id,
      doctorId: record.doctorProfileId,
      patientId: record.patientUserId,
      startsAt: record.startTime.toISOString(),
      endsAt: record.endTime.toISOString(),
      status: record.status,
      needsFollowUp: record.needsFollowUp,
      followUpId: record.followUp?.id ?? null,
      cancellationReason: record.cancellationReason ?? null,
      notes: record.notes ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      doctor: {
        id: record.doctorProfile.id,
        firstName: record.doctorProfile.user.firstName,
        lastName: record.doctorProfile.user.lastName,
        specialization: record.doctorProfile.specialization ?? null,
      },
      patient: {
        id: record.patient.id,
        firstName: record.patient.firstName,
        lastName: record.patient.lastName,
        phone: record.patient.phone ?? null,
      },
    };
  }
}

export type AppointmentRecord = {
  id: string;
  doctorProfileId: string;
  patientUserId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  needsFollowUp: boolean;
  idempotencyKey: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  followUp?: { id: string } | null;
  doctorProfile: {
    id: string;
    specialization: string | null;
    user: { firstName: string; lastName: string };
  };
  patient: { id: string; firstName: string; lastName: string; email: string; preferredLocale: Locale; phone: string | null };
};
