import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  APPOINTMENT_CONFIRMATION_BACKOFF_MS,
  APPOINTMENT_CONFIRMATION_EMAIL_JOB,
  NOTIFICATION_RETRY_ATTEMPTS,
  PASSWORD_RESET_BACKOFF_MS,
  PASSWORD_RESET_EMAIL_JOB,
  QUEUE_APPOINTMENT_CONFIRMATION,
  QUEUE_PASSWORD_RESET,
  QUEUE_REMINDER,
  QUEUE_WAITLIST_OFFER,
  REMINDER_BACKOFF_MS,
  REMINDER_EMAIL_JOB,
  REMINDER_JOB_ID_PREFIX,
  WAITLIST_OFFER_BACKOFF_MS,
  WAITLIST_OFFER_EMAIL_JOB,
} from './notifications.constants';
import type {
  AppointmentConfirmationJobPayload,
  PasswordResetJobPayload,
  ReminderJobPayload,
  WaitlistOfferJobPayload,
} from './interfaces/job-payloads.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(QUEUE_PASSWORD_RESET) private readonly passwordResetQueue: Queue,
    @InjectQueue(QUEUE_APPOINTMENT_CONFIRMATION) private readonly appointmentConfirmationQueue: Queue,
    @InjectQueue(QUEUE_REMINDER) private readonly reminderQueue: Queue,
    @InjectQueue(QUEUE_WAITLIST_OFFER) private readonly waitlistOfferQueue: Queue,
  ) {}

  async queuePasswordReset(payload: PasswordResetJobPayload): Promise<void> {
    await this.passwordResetQueue.add(PASSWORD_RESET_EMAIL_JOB, payload, {
      attempts: NOTIFICATION_RETRY_ATTEMPTS,
      backoff: { type: 'exponential', delay: PASSWORD_RESET_BACKOFF_MS },
    });
  }

  async queueAppointmentConfirmation(payload: AppointmentConfirmationJobPayload): Promise<void> {
    await this.appointmentConfirmationQueue.add(APPOINTMENT_CONFIRMATION_EMAIL_JOB, payload, {
      attempts: NOTIFICATION_RETRY_ATTEMPTS,
      backoff: { type: 'exponential', delay: APPOINTMENT_CONFIRMATION_BACKOFF_MS },
    });
  }

  async queueReminder(payload: ReminderJobPayload, startsAt: Date, reminderHoursBefore: number): Promise<void> {
    const jobId = `${REMINDER_JOB_ID_PREFIX}${payload.appointmentId}`;
    const delay = Math.max(startsAt.getTime() - reminderHoursBefore * 60 * 60_000 - Date.now(), 0);

    const existingJob = await this.reminderQueue.getJob(jobId).catch(() => undefined);
    if (existingJob) {
      await existingJob.remove().catch((error: unknown) => {
        this.logger.warn(`notifications.reminder_remove_failed appointmentId=${payload.appointmentId} error=${error instanceof Error ? error.message : 'unknown_error'}`);
      });
    }

    await this.reminderQueue.add(REMINDER_EMAIL_JOB, payload, {
      attempts: NOTIFICATION_RETRY_ATTEMPTS,
      backoff: { type: 'exponential', delay: REMINDER_BACKOFF_MS },
      jobId,
      delay,
    });
  }

  async queueWaitlistOffer(payload: WaitlistOfferJobPayload): Promise<void> {
    await this.waitlistOfferQueue.add(WAITLIST_OFFER_EMAIL_JOB, payload, {
      attempts: NOTIFICATION_RETRY_ATTEMPTS,
      backoff: { type: 'exponential', delay: WAITLIST_OFFER_BACKOFF_MS },
    });
  }
}
