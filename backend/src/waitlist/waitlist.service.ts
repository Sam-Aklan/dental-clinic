import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AppointmentStatus, Role, WaitlistOfferStatus } from '../generated/prisma/enums';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { SLOT_OPENED_JOB, WAITLIST_OFFER_ENGINE_QUEUE } from '../common/constants/queue.constants';
import { QueueService } from '../queue/queue.service';
import { JoinWaitlistDto, UpdateWindowDto, WaitlistEntryRecord, WaitlistEntryResponseDto, WaitlistOfferAcceptResponseDto, WaitlistOfferDeclineResponseDto, WaitlistOfferRecord, WaitlistOfferResponseDto, WaitlistQueryDto } from './dto';

type AppointmentRecord = {
  id: string;
  doctorProfileId: string;
  patientUserId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WAITLIST_OFFER_ENGINE_QUEUE) private readonly waitlistOfferQueue: Queue,
    private readonly queueService: QueueService,
    @Optional() private readonly auditService: AuditService = { log: async () => undefined } as unknown as AuditService,
  ) {}

  async joinWaitlist(dto: JoinWaitlistDto, currentUser: AuthenticatedUser): Promise<WaitlistEntryResponseDto> {
    const patientProfileId = this.requirePatientProfile(currentUser);
    const doctor = await this.ensureDoctor(dto.doctorId);
    const { availableFrom, availableUntil } = this.normalizeWindow(dto.availableFrom ?? null, dto.availableUntil ?? null);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const maxPosition = await tx.waitlistEntry.aggregate({
          where: { doctorProfileId: doctor.id },
          _max: { position: true },
        });

        const entry = await tx.waitlistEntry.create({
          data: {
            patientProfileId,
            doctorProfileId: doctor.id,
            position: (maxPosition._max.position ?? 0) + 1,
            availableFrom,
            availableUntil,
          },
          include: this.waitlistEntryInclude(),
        });

        this.logger.log(`waitlist.join entryId=${entry.id} doctorProfileId=${doctor.id} patientProfileId=${patientProfileId}`);
        return entry;
      });

      return WaitlistEntryResponseDto.fromRecord(created as WaitlistEntryRecord);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('already_on_waitlist');
      }
      throw error;
    }
  }

  async getWaitlist(query: WaitlistQueryDto, currentUser: AuthenticatedUser) {

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = await this.buildWaitlistWhere(query, currentUser);
    const [total, items] = await Promise.all([
      this.prisma.waitlistEntry.count({ where }),
      this.prisma.waitlistEntry.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ doctorProfileId: 'asc' }, { position: 'asc' }],
        include: this.waitlistEntryInclude(),
      }),
    ]);
    console.log("whitelist get items",query)

    return {
      items: items.map((item) => WaitlistEntryResponseDto.fromRecord(item as WaitlistEntryRecord)),
      total,
      page,
      pageSize,
    };
  }

  async updateWindow(id: string, dto: UpdateWindowDto, currentUser: AuthenticatedUser): Promise<WaitlistEntryResponseDto> {
    const patientProfileId = this.requirePatientProfile(currentUser);
    const entry = await this.getEntryOrThrow(id);
    this.assertEntryOwnership(entry.patientProfileId, patientProfileId);
    const { availableFrom, availableUntil } = this.normalizeWindow(dto.availableFrom ?? null, dto.availableUntil ?? null);

    const updated = await this.prisma.waitlistEntry.update({
      where: { id },
      data: { availableFrom, availableUntil },
      include: this.waitlistEntryInclude(),
    });

    this.logger.log(`waitlist.update entryId=${id} patientProfileId=${patientProfileId}`);
    return WaitlistEntryResponseDto.fromRecord(updated as WaitlistEntryRecord);
  }

  async leaveWaitlist(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const entry = await this.getEntryOrThrow(id);

    if (currentUser.role === Role.PATIENT) {
      const patientProfileId = this.requirePatientProfile(currentUser);
      this.assertEntryOwnership(entry.patientProfileId, patientProfileId);
      await this.prisma.waitlistEntry.delete({ where: { id } });
    } else {
      await this.prisma.$transaction(async (tx) => {
        await tx.waitlistEntry.delete({ where: { id } });
      });

      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.WAITLIST_ENTRY_DELETED,
        targetType: AUDIT_TARGET_TYPES.WAITLIST,
        targetId: id,
        payload: {
          patientProfileId: entry.patientProfileId,
          doctorProfileId: entry.doctorProfileId,
        },
      });
    }
    this.logger.log(`waitlist.leave entryId=${id} actorRole=${currentUser.role}`);
  }

  async getOffer(offerId: string, currentUser: AuthenticatedUser): Promise<WaitlistOfferResponseDto> {
    const offer = await this.getOfferOrThrow(offerId);
    const patientProfileId = this.requirePatientProfile(currentUser);
    this.assertOfferOwnership(offer.patientProfileId, patientProfileId);

    const currentAppointment = await this.getCurrentActiveAppointmentForOffer(offer);
    return WaitlistOfferResponseDto.fromRecord(offer as WaitlistOfferRecord, currentAppointment);
  }

  async acceptOffer(offerId: string, currentUser: AuthenticatedUser): Promise<WaitlistOfferAcceptResponseDto> {
    const offer = await this.getOfferOrThrow(offerId);
    const patientProfileId = this.requirePatientProfile(currentUser);
    this.assertOfferOwnership(offer.patientProfileId, patientProfileId);

    if (offer.status === WaitlistOfferStatus.ACCEPTED) {
      const appointment = await this.findAcceptedAppointment(offer);
      if (!appointment) {
        throw new NotFoundException('offer_not_found');
      }
      return WaitlistOfferAcceptResponseDto.fromRecord(offer.id, this.toAppointmentResponse(appointment));
    }

    if (offer.status !== WaitlistOfferStatus.PENDING || offer.expiresAt <= new Date()) {
      throw new ConflictException('offer_not_available');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await this.assertOfferedSlotFree(tx, offer);

      const existingAppointment = await tx.appointment.findFirst({
        where: {
          doctorProfileId: offer.doctorProfileId,
          patientUserId: offer.waitlistEntry.patientProfile.userId,
          status: { notIn: [AppointmentStatus.CANCELED, AppointmentStatus.COMPLETED] },
        },
        orderBy: [{ startTime: 'desc' }, { createdAt: 'desc' }],
      });

      let canceledAppointment: AppointmentRecord | null = null;
      if (existingAppointment) {
        canceledAppointment = await tx.appointment.update({
          where: { id: existingAppointment.id },
          data: { status: AppointmentStatus.CANCELED },
        });
      }

		const appointment = await tx.appointment.create({
			data: {
				doctorProfileId: offer.doctorProfileId,
				patientUserId: offer.waitlistEntry.patientProfile.userId,
				startTime: offer.offeredStartsAt,
				endTime: offer.offeredEndsAt,
				status: AppointmentStatus.CONFIRMED,
			},
		});

		await tx.waitlistOffer.update({ where: { id: offer.id }, data: { status: WaitlistOfferStatus.ACCEPTED } });

		return { appointment, canceledAppointment };
	});

    if (result.canceledAppointment) {
      await this.waitlistOfferQueue.add(SLOT_OPENED_JOB, {
        doctorProfileId: offer.doctorProfileId,
        startsAt: result.canceledAppointment.startTime.toISOString(),
        actorId: currentUser.userId,
        actorRole: currentUser.role,
      });
      this.logger.log(`waitlist.accept_slot_opened doctorProfileId=${offer.doctorProfileId} startsAt=${result.canceledAppointment.startTime.toISOString()}`);
      await this.queueService.emitUpdated(result.canceledAppointment.id, offer.doctorProfileId);
    }

    await this.queueService.emitUpdated(result.appointment.id, offer.doctorProfileId);

    return WaitlistOfferAcceptResponseDto.fromRecord(offer.id, this.toAppointmentResponse(result.appointment));
  }

  async declineOffer(offerId: string, currentUser: AuthenticatedUser): Promise<WaitlistOfferDeclineResponseDto> {
    const offer = await this.getOfferOrThrow(offerId);
    const patientProfileId = this.requirePatientProfile(currentUser);
    this.assertOfferOwnership(offer.patientProfileId, patientProfileId);

    if (offer.status === WaitlistOfferStatus.DECLINED) {
      return WaitlistOfferDeclineResponseDto.fromRecord(offer.id);
    }

    if (offer.status !== WaitlistOfferStatus.PENDING || offer.expiresAt <= new Date()) {
      throw new ConflictException('offer_not_available');
    }

	await this.prisma.$transaction(async (tx) => {
		await tx.waitlistOffer.update({ where: { id: offer.id }, data: { status: WaitlistOfferStatus.DECLINED } });
		await tx.waitlistEntry.delete({ where: { id: offer.waitlistEntryId } });
	});
	await this.waitlistOfferQueue.add(SLOT_OPENED_JOB, {
		doctorProfileId: offer.doctorProfileId,
		startsAt: offer.offeredStartsAt.toISOString(),
		actorId: currentUser.userId,
      actorRole: currentUser.role,
    });
    this.logger.log(`waitlist.decline offerId=${offer.id} doctorProfileId=${offer.doctorProfileId}`);
    return WaitlistOfferDeclineResponseDto.fromRecord(offer.id);
  }

  private requirePatientProfile(currentUser: AuthenticatedUser): string {
    if (currentUser.role !== Role.PATIENT || !currentUser.patientProfileId) {
      throw new ForbiddenException('forbidden');
    }
    return currentUser.patientProfileId;
  }

  private async ensureDoctor(doctorId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('doctor_not_found');
    }
    return doctor;
  }

  private normalizeWindow(from: string | null, until: string | null) {
    if ((from === null || from === undefined) && (until === null || until === undefined)) {
      return { availableFrom: null, availableUntil: null };
    }

    if (!from || !until) {
      throw new BadRequestException('window_incomplete');
    }

    if (from >= until) {
      throw new BadRequestException('window_invalid');
    }

    return { availableFrom: from, availableUntil: until };
  }

	private waitlistEntryInclude() {
		return {
			patientProfile: {
				include: { user: true },
			},
			doctorProfile: {
				include: { user: true },
			},
			offers: {
				where: { status: WaitlistOfferStatus.PENDING },
				orderBy: { createdAt: 'desc' },
				take: 1,
				select: { id: true },
			},
		} as const;
	}

  private waitlistOfferInclude() {
    return {
      doctorProfile: {
        include: { user: true },
      },
      waitlistEntry: {
        include: {
          patientProfile: {
            include: { user: true },
          },
        },
      },
    } as const;
  }

  private async buildWaitlistWhere(query: WaitlistQueryDto, currentUser: AuthenticatedUser) {
    if (currentUser.role === Role.DOCTOR) {
      throw new ForbiddenException('forbidden');
    }

    const where: Record<string, unknown> = {};
    if (query.doctorId) {
      where.doctorProfileId = query.doctorId;
    }

    if (currentUser.role === Role.PATIENT) {
      where.patientProfileId = this.requirePatientProfile(currentUser);
    }

    return where;
  }

  private async getEntryOrThrow(id: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException('waitlist_entry_not_found');
    }
    return entry;
  }

  private assertEntryOwnership(entryPatientProfileId: string, currentPatientProfileId: string) {
    if (entryPatientProfileId !== currentPatientProfileId) {
      throw new ForbiddenException('forbidden');
    }
  }

  private async getOfferOrThrow(offerId: string) {
    const offer = await this.prisma.waitlistOffer.findUnique({
      where: { id: offerId },
      include: this.waitlistOfferInclude(),
    });
    if (!offer) {
      throw new NotFoundException('offer_not_found');
    }
    return offer;
  }

  private assertOfferOwnership(offerPatientProfileId: string, currentPatientProfileId: string) {
    if (offerPatientProfileId !== currentPatientProfileId) {
      throw new ForbiddenException('forbidden');
    }
  }

  private async getCurrentActiveAppointmentForOffer(offer: WaitlistOfferRecord) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        doctorProfileId: offer.doctorProfileId,
        patientUserId: offer.waitlistEntry.patientProfile.userId,
        status: { notIn: [AppointmentStatus.CANCELED, AppointmentStatus.COMPLETED] },
      },
      orderBy: [{ startTime: 'desc' }, { createdAt: 'desc' }],
    });

    return appointment ? this.toAppointmentResponse(appointment) : null;
  }

  private async findAcceptedAppointment(offer: WaitlistOfferRecord) {
    return this.prisma.appointment.findFirst({
      where: {
        doctorProfileId: offer.doctorProfileId,
        patientUserId: offer.waitlistEntry.patientProfile.userId,
        startTime: offer.offeredStartsAt,
        endTime: offer.offeredEndsAt,
        status: AppointmentStatus.CONFIRMED,
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  private async assertOfferedSlotFree(tx: any, offer: WaitlistOfferRecord) {
    const conflict = await tx.appointment.findFirst({
      where: {
        doctorProfileId: offer.doctorProfileId,
        status: { not: AppointmentStatus.CANCELED },
        startTime: { lt: offer.offeredEndsAt },
        endTime: { gt: offer.offeredStartsAt },
      },
    });

    if (conflict) {
      throw new ConflictException('slot_unavailable');
    }
  }

  private toAppointmentResponse(appointment: AppointmentRecord) {
    return {
      id: appointment.id,
      startsAt: appointment.startTime.toISOString(),
      endsAt: appointment.endTime.toISOString(),
      status: appointment.status,
    };
  }
}
