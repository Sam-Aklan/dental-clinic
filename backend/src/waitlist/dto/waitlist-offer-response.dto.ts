import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaitlistOfferStatus } from '../../generated/prisma/enums';

export class WaitlistOfferDoctorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  specialization!: string | null;
}

export class WaitlistOfferAppointmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  @ApiProperty({ format: 'date-time' })
  endsAt!: string;

  @ApiProperty()
  status!: string;
}

export class WaitlistOfferResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WaitlistOfferStatus })
  status!: WaitlistOfferStatus;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ type: WaitlistOfferDoctorDto })
  doctor!: WaitlistOfferDoctorDto;

  @ApiProperty({ nullable: true, type: WaitlistOfferAppointmentDto })
  currentAppointment!: WaitlistOfferAppointmentDto | null;

  @ApiProperty()
  offeredSlot!: {
    startsAt: string;
    endsAt: string;
  };

  static fromRecord(record: WaitlistOfferRecord, currentAppointment: WaitlistOfferAppointmentDto | null): WaitlistOfferResponseDto {
    return {
      id: record.id,
      status: record.status,
      expiresAt: record.expiresAt.toISOString(),
      offeredSlot: {
        startsAt: record.offeredStartsAt.toISOString(),
        endsAt: record.offeredEndsAt.toISOString(),
      },
      doctor: {
        id: record.doctorProfile.id,
        firstName: record.doctorProfile.user.firstName,
        lastName: record.doctorProfile.user.lastName,
        specialization: record.doctorProfile.specialization ?? null,
      },
      currentAppointment,
    };
  }
}

export class WaitlistOfferAcceptResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WaitlistOfferStatus })
  status!: WaitlistOfferStatus;

  @ApiProperty({ type: WaitlistOfferAppointmentDto })
  appointment!: WaitlistOfferAppointmentDto;

  static fromRecord(offerId: string, appointment: WaitlistOfferAppointmentDto): WaitlistOfferAcceptResponseDto {
    return { id: offerId, status: WaitlistOfferStatus.ACCEPTED, appointment };
  }
}

export class WaitlistOfferDeclineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WaitlistOfferStatus })
  status!: WaitlistOfferStatus;

  static fromRecord(offerId: string): WaitlistOfferDeclineResponseDto {
    return { id: offerId, status: WaitlistOfferStatus.DECLINED };
  }
}

export type WaitlistOfferRecord = {
  id: string;
  waitlistEntryId: string;
  patientProfileId: string;
  doctorProfileId: string;
  offeredStartsAt: Date;
  offeredEndsAt: Date;
  status: WaitlistOfferStatus;
  expiresAt: Date;
  doctorProfile: {
    id: string;
    specialization: string | null;
    user: { firstName: string; lastName: string };
  };
  waitlistEntry: {
    patientProfile: {
      id: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string };
    };
  };
};
