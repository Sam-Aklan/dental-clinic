import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import {
  OFFER_EXPIRY_JOB,
  WAITLIST_OFFER_ENGINE_QUEUE,
  SLOT_OPENED_JOB,
} from '../common/constants/queue.constants';
import { UserRole } from '../common/types/authenticated-user.type';
import { Locale, WaitlistOfferStatus } from '../generated/prisma/enums';
import { NotificationsService } from '../notifications/notifications.service';

export type SlotOpenedJobPayload = {
  doctorProfileId: string;
  startsAt: string;
  actorId?: string;
  actorRole?: UserRole;
};

export type OfferExpiryJobPayload = {
  offerId: string;
  doctorProfileId: string;
  startsAt: string;
  actorId?: string;
  actorRole?: UserRole;
};

export type WaitlistOfferEmailJobPayload = {
  patientProfileId: string;
  offerId: string;
};

export type WaitlistEntryRecord = {
  id: string;
  patientProfileId: string;
  doctorProfileId: string;
  position: number;
  availableFrom: string | null;
  availableUntil: string | null;
  patientProfile: { user: { id: string; firstName: string; email: string; preferredLocale: Locale } };
  offers: Array<{ id: string; status: WaitlistOfferStatus; doctorProfileId: string }>;
};

export type ClinicConfigRecord = {
  slotDurationMinutes: number;
  offerWindowMinutes: number;
  minArrivalMinutes: number;
  timeZone: string;
};

export type WaitlistOfferRecord = {
  id: string;
  waitlistEntryId: string;
  patientProfileId: string;
  doctorProfileId: string;
  offeredStartsAt: Date;
  offeredEndsAt: Date;
  status: WaitlistOfferStatus;
  expiresAt: Date;
};

@Injectable()
export class WaitlistOfferEngineService {
  private readonly logger = new Logger(WaitlistOfferEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicConfigService: ClinicConfigService,
    @InjectQueue(WAITLIST_OFFER_ENGINE_QUEUE) private readonly waitlistOfferQueue: Queue,
    private readonly notificationsService: NotificationsService,
    @Optional() private readonly auditService: AuditService = { log: async () => undefined } as unknown as AuditService,
  ) {}

  async processSlotOpened(payload: SlotOpenedJobPayload): Promise<void> {
    const doctorProfileId = payload.doctorProfileId?.trim();
    if (!doctorProfileId) {
      this.logger.warn(`slot_opened.discarded reason=invalid_doctor doctorProfileId=${payload.doctorProfileId ?? ''}`);
      return;
    }

    const slotStartsAt = new Date(payload.startsAt);
    if (!payload.startsAt || Number.isNaN(slotStartsAt.getTime()) || slotStartsAt.getTime() <= Date.now()) {
      this.logger.warn(`slot_opened.discarded reason=slot_in_past doctorProfileId=${doctorProfileId} startsAt=${payload.startsAt ?? ''}`);
      return;
    }

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: doctorProfileId }, select: { id: true } });
    if (!doctor) {
      this.logger.warn(`slot_opened.discarded reason=invalid_doctor doctorProfileId=${doctorProfileId} startsAt=${payload.startsAt}`);
      return;
    }

    const config = (await this.clinicConfigService.getConfig()) as ClinicConfigRecord;
    const entries = (await this.prisma.waitlistEntry.findMany({
      where: { doctorProfileId },
      orderBy: { position: 'asc' },
      include: {
        patientProfile: { include: { user: { select: { id: true, firstName: true, email: true, preferredLocale: true } } } },
        offers: {
          where: {
            doctorProfileId,
            status: WaitlistOfferStatus.PENDING,
          },
          select: { id: true, status: true, doctorProfileId: true },
        },
      },
    })) as WaitlistEntryRecord[];

    const selection = this.findEligibleEntry(entries, slotStartsAt, config);
    if (!selection.entry) {
      this.logger.log(
        `no_eligible_patient doctorProfileId=${doctorProfileId} startsAt=${slotStartsAt.toISOString()} candidates=${entries.length} skippedByBuffer=${selection.skippedByBuffer} skippedByWindow=${selection.skippedByWindow}`,
      );
      return;
    }

    await this.createOffer(selection.entry, slotStartsAt, config, payload.actorId, payload.actorRole);
  }

  async processOfferExpiry(payload: OfferExpiryJobPayload): Promise<void> {
    const offerId = payload.offerId?.trim();
    if (!offerId) {
      this.logger.warn('invalid_offer_id');
      return;
    }

    const result = await this.prisma.waitlistOffer.updateMany({
      where: { id: offerId, status: WaitlistOfferStatus.PENDING },
      data: { status: WaitlistOfferStatus.EXPIRED },
    });

    if (result.count === 0) {
      const existing = await this.prisma.waitlistOffer.findUnique({ where: { id: offerId }, select: { id: true, status: true } });
      if (!existing) {
        this.logger.warn(`invalid_offer_id offerId=${offerId}`);
        return;
      }

      this.logger.log(`offer_already_resolved offerId=${offerId} status=${existing.status}`);
      return;
    }

    await this.waitlistOfferQueue.add(SLOT_OPENED_JOB, {
      doctorProfileId: payload.doctorProfileId,
      startsAt: payload.startsAt,
      actorId: payload.actorId,
      actorRole: payload.actorRole,
    });

    if (payload.actorId && payload.actorRole) {
      await this.auditService.log({
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        action: AUDIT_ACTIONS.WAITLIST_OFFER_EXPIRED,
        targetType: AUDIT_TARGET_TYPES.WAITLIST_OFFER,
        targetId: offerId,
        payload: { doctorProfileId: payload.doctorProfileId, startsAt: payload.startsAt },
      });
    }
  }

  private findEligibleEntry(
    entries: WaitlistEntryRecord[],
    slotStartsAt: Date,
    config: ClinicConfigRecord,
  ): { entry: WaitlistEntryRecord | null; skippedByBuffer: number; skippedByWindow: number } {
    let skippedByBuffer = 0;
    let skippedByWindow = 0;
    const localTime = this.slotLocalTime(slotStartsAt, config.timeZone);

    for (const entry of entries) {
      if (Date.now() + config.minArrivalMinutes * 60_000 > slotStartsAt.getTime()) {
        skippedByBuffer += 1;
        continue;
      }

      if (entry.availableFrom && entry.availableUntil) {
        if (!(entry.availableFrom <= localTime && localTime < entry.availableUntil)) {
          skippedByWindow += 1;
          continue;
        }
      }

      if (entry.offers.length > 0) {
        continue;
      }

      return { entry, skippedByBuffer, skippedByWindow };
    }

    return { entry: null, skippedByBuffer, skippedByWindow };
  }

  private async createOffer(
    entry: WaitlistEntryRecord,
    slotStartsAt: Date,
    config: ClinicConfigRecord,
    actorId?: string,
    actorRole?: UserRole,
  ): Promise<WaitlistOfferRecord> {
    const offeredEndsAt = new Date(slotStartsAt.getTime() + config.slotDurationMinutes * 60_000);
    const expiresAt = new Date(Date.now() + config.offerWindowMinutes * 60_000);

    const offer = (await this.prisma.$transaction(async (tx) => {
      return tx.waitlistOffer.create({
        data: {
          waitlistEntryId: entry.id,
          patientProfileId: entry.patientProfileId,
          doctorProfileId: entry.doctorProfileId,
          offeredStartsAt: slotStartsAt,
          offeredEndsAt,
          status: WaitlistOfferStatus.PENDING,
          expiresAt,
        },
      });
    })) as WaitlistOfferRecord;

    const delay = Math.max(expiresAt.getTime() - Date.now(), 0);
    await this.waitlistOfferQueue.add(
      OFFER_EXPIRY_JOB,
      {
        offerId: offer.id,
        doctorProfileId: offer.doctorProfileId,
        startsAt: slotStartsAt.toISOString(),
        actorId,
        actorRole,
      },
      { delay },
    );

    await this.notificationsService.queueWaitlistOffer({
      offerId: offer.id,
      patientUserId: entry.patientProfile.user.id,
      offerUrl: this.frontendUrl(`/offers/${offer.id}`),
      locale: entry.patientProfile.user.preferredLocale === Locale.AR ? 'ar' : 'en',
    });

    if (actorId && actorRole) {
      await this.auditService.log({
        actorId,
        actorRole,
        action: AUDIT_ACTIONS.WAITLIST_OFFER_CREATED,
        targetType: AUDIT_TARGET_TYPES.WAITLIST_OFFER,
        targetId: offer.id,
        payload: {
          doctorProfileId: offer.doctorProfileId,
          patientProfileId: offer.patientProfileId,
          offeredStartsAt: offer.offeredStartsAt.toISOString(),
        },
      });
    }

    this.logger.log(
      `offer_created offerId=${offer.id} patientProfileId=${offer.patientProfileId} doctorProfileId=${offer.doctorProfileId} expiresAt=${offer.expiresAt.toISOString()}`,
    );

    return offer;
  }

  private slotLocalTime(slotUtc: Date, timeZone: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(slotUtc);
  }

  private frontendUrl(pathname: string): string {
    const baseUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    return `${baseUrl}${pathname}`;
  }
}
