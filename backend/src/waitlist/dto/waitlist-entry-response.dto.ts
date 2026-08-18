import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WaitlistEntryDoctorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  specialization!: string | null;
}

export class WaitlistEntryPatientDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;
}

export class WaitlistEntryPendingOfferDto {
  @ApiProperty()
  id!: string;
}

export class WaitlistEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty()
  position!: number;

  @ApiPropertyOptional({ nullable: true })
  availableFrom!: string | null;

  @ApiPropertyOptional({ nullable: true })
  availableUntil!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: WaitlistEntryDoctorDto })
  doctor!: WaitlistEntryDoctorDto;

  @ApiProperty({ type: WaitlistEntryPatientDto })
  patient!: WaitlistEntryPatientDto;

  @ApiPropertyOptional({ type: WaitlistEntryPendingOfferDto, nullable: true })
  pendingOffer!: WaitlistEntryPendingOfferDto | null;

  static fromRecord(record: WaitlistEntryRecord): WaitlistEntryResponseDto {
    return {
      id: record.id,
      doctorId: record.doctorProfileId,
      patientId: record.patientProfileId,
      position: record.position,
      availableFrom: record.availableFrom ?? null,
      availableUntil: record.availableUntil ?? null,
      createdAt: record.createdAt.toISOString(),
      doctor: {
        id: record.doctorProfile.id,
        firstName: record.doctorProfile.user.firstName,
        lastName: record.doctorProfile.user.lastName,
        specialization: record.doctorProfile.specialization ?? null,
      },
			patient: {
				id: record.patientProfile.id,
				firstName: record.patientProfile.user.firstName,
				lastName: record.patientProfile.user.lastName,
			},
			pendingOffer: record.offers?.[0] ? { id: record.offers[0].id } : null,
		};
	}
}

export type WaitlistEntryRecord = {
  id: string;
  patientProfileId: string;
  doctorProfileId: string;
  position: number;
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: Date;
  doctorProfile: {
    id: string;
    specialization: string | null;
    user: { firstName: string; lastName: string };
  };
	patientProfile: {
		id: string;
		user: { firstName: string; lastName: string };
	};
	offers: { id: string }[];
};
