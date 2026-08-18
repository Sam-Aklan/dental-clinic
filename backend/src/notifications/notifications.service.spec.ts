import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const createService = () => {
    const passwordResetQueue = { add: jest.fn() };
    const appointmentConfirmationQueue = { add: jest.fn() };
    const existingReminderJob = { remove: jest.fn().mockResolvedValue(undefined) };
    const reminderQueue = { add: jest.fn(), getJob: jest.fn().mockResolvedValue(existingReminderJob) };
    const waitlistOfferQueue = { add: jest.fn() };

    return {
      service: new NotificationsService(passwordResetQueue as never, appointmentConfirmationQueue as never, reminderQueue as never, waitlistOfferQueue as never),
      passwordResetQueue,
      appointmentConfirmationQueue,
      reminderQueue,
      waitlistOfferQueue,
      existingReminderJob,
    };
  };

  it('queues password reset emails with retries', async () => {
    const { service, passwordResetQueue } = createService();

    await service.queuePasswordReset({ userId: 'user-1', tokenId: 'token-1', resetUrl: 'https://frontend/reset', locale: 'en' });

    expect(passwordResetQueue.add).toHaveBeenCalledWith('password-reset-email', expect.any(Object), expect.objectContaining({ attempts: 3 }));
  });

  it('replaces reminder jobs by job id', async () => {
    const { service, reminderQueue, existingReminderJob } = createService();

    await service.queueReminder({ appointmentId: 'appt-1', patientUserId: 'user-1', locale: 'ar' }, new Date('2026-05-15T10:00:00.000Z'), 2);

    expect(reminderQueue.getJob).toHaveBeenCalledWith('reminder-appt-1');
    expect(existingReminderJob.remove).toHaveBeenCalled();
    expect(reminderQueue.add).toHaveBeenCalledWith('appointment-reminder-email', expect.any(Object), expect.objectContaining({ jobId: 'reminder-appt-1' }));
  });

  it('queues waitlist offer emails with retries', async () => {
    const { service, waitlistOfferQueue } = createService();

    await service.queueWaitlistOffer({ offerId: 'offer-1', patientUserId: 'user-1', offerUrl: 'https://frontend/offers/offer-1', locale: 'en' });

    expect(waitlistOfferQueue.add).toHaveBeenCalledWith('waitlist-offer-email', expect.any(Object), expect.objectContaining({ attempts: 3 }));
  });
});
