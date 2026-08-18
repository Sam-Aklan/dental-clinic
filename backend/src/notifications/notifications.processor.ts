import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { Transporter } from 'nodemailer';
import { Locale, WaitlistOfferStatus, AppointmentStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateService } from './template.service';
import { MAIL_TRANSPORT, QUEUE_APPOINTMENT_CONFIRMATION, QUEUE_PASSWORD_RESET, QUEUE_REMINDER, QUEUE_WAITLIST_OFFER, DEFAULT_NOTIFICATION_LOCALE, PASSWORD_RESET_EMAIL_JOB, APPOINTMENT_CONFIRMATION_EMAIL_JOB, REMINDER_EMAIL_JOB, WAITLIST_OFFER_EMAIL_JOB } from './notifications.constants';
import type { NotificationLocale } from './notifications.constants';
import type { AppointmentConfirmationJobPayload, ReminderJobPayload, PasswordResetJobPayload, WaitlistOfferJobPayload, AppointmentConfirmationTemplateVars, AppointmentReminderTemplateVars, PasswordResetTemplateVars, WaitlistOfferTemplateVars } from './interfaces/job-payloads.interface';

type AppointmentRecord = {
  id: string;
  doctorProfileId: string;
  patientUserId: string;
  startTime: Date;
  status: AppointmentStatus;
  doctorProfile: { user: { firstName: string; lastName: string } };
  patient: { id: string; firstName: string; lastName: string; email: string; preferredLocale: Locale };
};

type PasswordResetRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: { id: string; firstName: string; email: string; preferredLocale: Locale };
};

type WaitlistOfferRecord = {
  id: string;
  patientProfileId: string;
  doctorProfileId: string;
  offeredStartsAt: Date;
  offeredEndsAt: Date;
  expiresAt: Date;
  status: WaitlistOfferStatus;
  patientProfile: { user: { id: string; firstName: string; email: string; preferredLocale: Locale } };
  doctorProfile: { user: { firstName: string; lastName: string } };
};

@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
    @Inject(MAIL_TRANSPORT) private readonly transporter: Transporter,
  ) {}

  async handlePasswordReset(payload: PasswordResetJobPayload): Promise<void> {
    const now = new Date(Date.now());
    const token = (await this.prisma.passwordResetToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: { select: { id: true, firstName: true, email: true, preferredLocale: true } } },
    })) as PasswordResetRecord | null;

    if (!token) {
      this.logger.warn(`notification.password_reset.skipped token_missing tokenId=${payload.tokenId}`);
      return;
    }

    if (token.userId !== payload.userId) {
      this.logger.warn(`notification.password_reset.skipped token_missing tokenId=${payload.tokenId}`);
      return;
    }

    if (token.usedAt || token.expiresAt <= now) {
      this.logger.log(`notification.password_reset.skipped reason=token_expired_or_used tokenId=${token.id} userId=${token.userId}`);
      return;
    }

    const latestActive = await this.prisma.passwordResetToken.findFirst({
      where: { userId: token.userId, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (latestActive?.id !== token.id) {
      this.logger.log(`notification.password_reset.skipped reason=token_superseded tokenId=${token.id} userId=${token.userId}`);
      return;
    }

    const locale = this.toNotificationLocale(token.user.preferredLocale);
    const template = this.templateService.render('password-reset', locale, {
      firstName: token.user.firstName,
      resetUrl: payload.resetUrl,
      expiresInMinutes: Math.max(Math.ceil((token.expiresAt.getTime() - Date.now()) / 60_000), 1),
      clinicName: 'Dental Clinic',
      clinicEmail: this.configService.getOrThrow<string>('CLINIC_EMAIL'),
    } satisfies PasswordResetTemplateVars);

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? 'Dental Clinic <noreply@clinic.local>',
      to: token.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    this.logger.log(`notification.password_reset.sent tokenId=${token.id} userId=${token.userId}`);
  }

  async handleAppointmentConfirmation(payload: AppointmentConfirmationJobPayload): Promise<void> {
    const now = new Date(Date.now());
    const appointment = (await this.prisma.appointment.findUnique({
      where: { id: payload.appointmentId },
      include: {
        doctorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
        patient: { select: { id: true, firstName: true, lastName: true, email: true, preferredLocale: true } },
      },
    })) as AppointmentRecord | null;

    if (!appointment || appointment.patientUserId !== payload.patientUserId) {
      this.logger.log(`notification.appointment_confirmation.skipped reason=appointment_missing appointmentId=${payload.appointmentId}`);
      return;
    }

    if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.CONFIRMED) {
      this.logger.log(`notification.appointment_confirmation.skipped reason=appointment_not_eligible appointmentId=${appointment.id} status=${appointment.status}`);
      return;
    }

    const locale = this.toNotificationLocale(appointment.patient.preferredLocale);
    const { date, time } = this.formatClinicDateTime(appointment.startTime, locale);
    const template = this.templateService.render('appointment-confirmation', locale, {
      firstName: appointment.patient.firstName,
      doctorName: `${appointment.doctorProfile.user.firstName} ${appointment.doctorProfile.user.lastName}`.trim(),
      date,
      time,
      clinicName: 'Dental Clinic',
      myAppointmentsUrl: this.frontendUrl('/my-appointments'),
      clinicEmail: this.configService.getOrThrow<string>('CLINIC_EMAIL'),
    } satisfies AppointmentConfirmationTemplateVars);

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? 'Dental Clinic <noreply@clinic.local>',
      to: appointment.patient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    this.logger.log(`notification.appointment_confirmation.sent appointmentId=${appointment.id} patientUserId=${appointment.patientUserId}`);
  }

  async handleReminder(payload: ReminderJobPayload): Promise<void> {
    const now = new Date(Date.now());
    const appointment = (await this.prisma.appointment.findUnique({
      where: { id: payload.appointmentId },
      include: {
        doctorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
        patient: { select: { id: true, firstName: true, lastName: true, email: true, preferredLocale: true } },
      },
    })) as AppointmentRecord | null;

    if (!appointment || appointment.patientUserId !== payload.patientUserId) {
      this.logger.log(`notification.appointment_reminder.skipped reason=appointment_missing appointmentId=${payload.appointmentId}`);
      return;
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.IN_PROGRESS) {
      this.logger.log(`notification.appointment_reminder.skipped reason=appointment_not_active appointmentId=${appointment.id} status=${appointment.status}`);
      return;
    }

    const clinicConfig = await this.prisma.clinicConfig.findFirst();
    const timeZone = clinicConfig?.timeZone ?? 'UTC';
    const hoursUntil = clinicConfig?.reminderHoursBefore ?? 0;
    const locale = this.toNotificationLocale(appointment.patient.preferredLocale);
    const { date, time } = this.formatClinicDateTime(appointment.startTime, locale, timeZone);
    const template = this.templateService.render('appointment-reminder', locale, {
      firstName: appointment.patient.firstName,
      doctorName: `${appointment.doctorProfile.user.firstName} ${appointment.doctorProfile.user.lastName}`.trim(),
      date,
      time,
      hoursUntil,
      clinicName: 'Dental Clinic',
      myAppointmentsUrl: this.frontendUrl('/my-appointments'),
      clinicEmail: this.configService.getOrThrow<string>('CLINIC_EMAIL'),
    } satisfies AppointmentReminderTemplateVars);

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? 'Dental Clinic <noreply@clinic.local>',
      to: appointment.patient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    this.logger.log(`notification.appointment_reminder.sent appointmentId=${appointment.id} patientUserId=${appointment.patientUserId}`);
  }

  async handleWaitlistOffer(payload: WaitlistOfferJobPayload): Promise<void> {
    const now = new Date(Date.now());
    const offer = (await this.prisma.waitlistOffer.findUnique({
      where: { id: payload.offerId },
      include: {
        patientProfile: { include: { user: { select: { id: true, firstName: true, email: true, preferredLocale: true } } } },
        doctorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    })) as WaitlistOfferRecord | null;

    if (!offer || offer.patientProfile.user.id !== payload.patientUserId) {
      this.logger.log(`notification.waitlist_offer.skipped reason=offer_missing offerId=${payload.offerId}`);
      return;
    }

    if (offer.status !== WaitlistOfferStatus.PENDING || offer.expiresAt <= now) {
      this.logger.log(`notification.waitlist_offer.skipped reason=offer_not_pending offerId=${offer.id} status=${offer.status}`);
      return;
    }

    const clinicConfig = await this.prisma.clinicConfig.findFirst();
    const timeZone = clinicConfig?.timeZone ?? 'UTC';
    const locale = this.toNotificationLocale(offer.patientProfile.user.preferredLocale);
    const { date, time } = this.formatClinicDateTime(offer.offeredStartsAt, locale, timeZone);
    const expiresAt = new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(offer.expiresAt);
    const template = this.templateService.render('waitlist-offer', locale, {
      firstName: offer.patientProfile.user.firstName,
      doctorName: `${offer.doctorProfile.user.firstName} ${offer.doctorProfile.user.lastName}`.trim(),
      date,
      time,
      offerUrl: payload.offerUrl,
      expiresAt,
      clinicName: 'Dental Clinic',
      clinicEmail: this.configService.getOrThrow<string>('CLINIC_EMAIL'),
    } satisfies WaitlistOfferTemplateVars);

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? 'Dental Clinic <noreply@clinic.local>',
      to: offer.patientProfile.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    this.logger.log(`notification.waitlist_offer.sent offerId=${offer.id} patientUserId=${offer.patientProfile.user.id}`);
  }

  private frontendUrl(pathname: string): string {
    const baseUrl = (this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').replace(/\/$/, '');
    return `${baseUrl}${pathname}`;
  }

  private formatClinicDateTime(date: Date, locale: NotificationLocale, timeZone = 'UTC'): { date: string; time: string } {
    return {
      date: new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full' }).format(date),
      time: new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }).format(date),
    };
  }

  private toNotificationLocale(locale: Locale | null | undefined): NotificationLocale {
    return locale === Locale.AR ? 'ar' : DEFAULT_NOTIFICATION_LOCALE;
  }
}

@Processor(QUEUE_PASSWORD_RESET)
export class PasswordResetNotificationsProcessor extends WorkerHost {
  constructor(private readonly processor: NotificationsProcessor) {
    super();
  }

  async process(job: Job<PasswordResetJobPayload>): Promise<void> {
    if (job.name !== PASSWORD_RESET_EMAIL_JOB) {
      return;
    }
    return this.processor.handlePasswordReset(job.data);
  }
}

@Processor(QUEUE_APPOINTMENT_CONFIRMATION)
export class AppointmentConfirmationNotificationsProcessor extends WorkerHost {
  constructor(private readonly processor: NotificationsProcessor) {
    super();
  }

  async process(job: Job<AppointmentConfirmationJobPayload>): Promise<void> {
    if (job.name !== APPOINTMENT_CONFIRMATION_EMAIL_JOB) {
      return;
    }
    return this.processor.handleAppointmentConfirmation(job.data);
  }
}

@Processor(QUEUE_REMINDER)
export class ReminderNotificationsProcessor extends WorkerHost {
  constructor(private readonly processor: NotificationsProcessor) {
    super();
  }

  async process(job: Job<ReminderJobPayload>): Promise<void> {
    if (job.name !== REMINDER_EMAIL_JOB) {
      return;
    }
    return this.processor.handleReminder(job.data);
  }
}

@Processor(QUEUE_WAITLIST_OFFER)
export class WaitlistOfferNotificationsProcessor extends WorkerHost {
  constructor(private readonly processor: NotificationsProcessor) {
    super();
  }

  async process(job: Job<WaitlistOfferJobPayload>): Promise<void> {
    if (job.name !== WAITLIST_OFFER_EMAIL_JOB) {
      return;
    }
    return this.processor.handleWaitlistOffer(job.data);
  }
}
