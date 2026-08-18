import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Locale, AppointmentStatus, WaitlistOfferStatus } from '../src/generated/prisma/enums';
import { NotificationsProcessor } from '../src/notifications/notifications.processor';
import { TemplateService } from '../src/notifications/template.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { clearMailhog } from './helpers/mailhog';
import { createNotificationAppointmentSeed, createNotificationWaitlistOfferSeed } from './helpers/notifications-seed';

describe('Notifications E2E', () => {
  const prisma = {
    passwordResetToken: { findUnique: jest.fn(), findFirst: jest.fn() },
    appointment: { findUnique: jest.fn() },
    waitlistOffer: { findUnique: jest.fn() },
    clinicConfig: { findFirst: jest.fn() },
  };
  const transporter = { sendMail: jest.fn() };

  let module: TestingModule;
  let processor: NotificationsProcessor;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        TemplateService,
        NotificationsProcessor,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: 'MAIL_TRANSPORT',
          useValue: transporter,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('Dental Clinic <noreply@clinic.local>'),
            getOrThrow: jest.fn().mockReturnValue('support@dentalclinic.local'),
          },
        },
      ],
    }).compile();

    processor = module.get(NotificationsProcessor);
    module.get(TemplateService).onModuleInit();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-19T08:00:00.000Z').getTime());
    clearMailhog().catch(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    clearMailhog().catch(() => undefined);
  });

  it('renders appointment confirmation emails with clinic contact info', async () => {
    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(
      createNotificationAppointmentSeed({
        status: AppointmentStatus.CONFIRMED,
        patient: {
          id: 'patient-user-1',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'patient@example.com',
          preferredLocale: Locale.EN,
        },
      }),
    );

    await processor.handleAppointmentConfirmation({ appointmentId: 'appointment-1', patientUserId: 'patient-user-1', locale: 'en' });

    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'patient@example.com',
    }));
  });

  it('renders waitlist offer emails with rtl copy', async () => {
    (prisma.waitlistOffer.findUnique as jest.Mock).mockResolvedValue(
      createNotificationWaitlistOfferSeed({
        status: WaitlistOfferStatus.PENDING,
        patientProfile: {
          user: {
            id: 'patient-user-1',
            firstName: 'Jane',
            email: 'patient@example.com',
            preferredLocale: Locale.AR,
          },
        },
      }),
    );
    (prisma.clinicConfig.findFirst as jest.Mock).mockResolvedValue({ timeZone: 'UTC', reminderHoursBefore: 24 });

    await processor.handleWaitlistOffer({ offerId: 'offer-1', patientUserId: 'patient-user-1', offerUrl: 'https://frontend/offers/offer-1', locale: 'ar' });

    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'patient@example.com',
    }));
  });
});
