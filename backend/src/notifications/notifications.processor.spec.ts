import { ConfigService } from '@nestjs/config';
import { Locale, AppointmentStatus, WaitlistOfferStatus } from '../generated/prisma/enums';
import { NotificationsProcessor } from './notifications.processor';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsProcessor', () => {
  const createProcessor = () => {
    const prisma = {
      passwordResetToken: { findUnique: jest.fn(), findFirst: jest.fn() },
      appointment: { findUnique: jest.fn() },
      waitlistOffer: { findUnique: jest.fn() },
      clinicConfig: { findFirst: jest.fn() },
    };
    const templateService = new TemplateService();
    templateService.onModuleInit();
    const transporter = { sendMail: jest.fn() };
    const configService = {
      get: jest.fn().mockReturnValue('Dental Clinic <noreply@clinic.local>'),
      getOrThrow: jest.fn().mockReturnValue('support@dentalclinic.local'),
    };

    return {
      processor: new NotificationsProcessor(prisma as unknown as PrismaService, templateService, configService as unknown as ConfigService, transporter as never),
      prisma,
      transporter,
      configService,
    };
  };

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-15T08:00:00.000Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends password reset emails for the newest active token', async () => {
    const { processor, prisma, transporter, configService } = createProcessor();
    (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
      id: 'token-1',
      tokenHash: 'hash',
      userId: 'user-1',
      expiresAt: new Date('2026-05-15T09:00:00.000Z'),
      usedAt: null,
      user: { id: 'user-1', firstName: 'Jana', email: 'jana@example.com', preferredLocale: Locale.EN },
    });
    (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue({ id: 'token-1' });

    await processor.handlePasswordReset({ userId: 'user-1', tokenId: 'token-1', resetUrl: 'https://frontend/reset?token=abc', locale: 'en' });

    expect(transporter.sendMail).toHaveBeenCalled();
    expect(configService.getOrThrow).toHaveBeenCalledWith('CLINIC_EMAIL');
  });

  it('skips expired appointment confirmations', async () => {
    const { processor, prisma, transporter } = createProcessor();
    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
      id: 'appt-1',
      doctorProfileId: 'doctor-1',
      patientUserId: 'user-1',
      startTime: new Date('2026-05-15T10:00:00.000Z'),
      status: AppointmentStatus.CANCELED,
      doctorProfile: { user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'user-1', firstName: 'Jana', lastName: 'Doe', email: 'jana@example.com', preferredLocale: Locale.EN },
    });

    await processor.handleAppointmentConfirmation({ appointmentId: 'appt-1', patientUserId: 'user-1', locale: 'en' });

    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('sends waitlist offers when pending', async () => {
    const { processor, prisma, transporter } = createProcessor();
    (prisma.waitlistOffer.findUnique as jest.Mock).mockResolvedValue({
      id: 'offer-1',
      patientProfileId: 'profile-1',
      doctorProfileId: 'doctor-1',
      offeredStartsAt: new Date('2026-05-15T10:00:00.000Z'),
      offeredEndsAt: new Date('2026-05-15T10:30:00.000Z'),
      expiresAt: new Date('2026-05-15T10:20:00.000Z'),
      status: WaitlistOfferStatus.PENDING,
      patientProfile: { user: { id: 'user-1', firstName: 'Jana', email: 'jana@example.com', preferredLocale: Locale.AR } },
      doctorProfile: { user: { firstName: 'Doc', lastName: 'Tor' } },
    });
    (prisma.clinicConfig.findFirst as jest.Mock).mockResolvedValue({ timeZone: 'UTC', reminderHoursBefore: 24 });

    await processor.handleWaitlistOffer({ offerId: 'offer-1', patientUserId: 'user-1', offerUrl: 'https://frontend/offers/offer-1', locale: 'ar' });

    expect(transporter.sendMail).toHaveBeenCalled();
  });
});
