import { TemplateService } from './template.service';

const clinicName = 'Dental Clinic';
const clinicEmail = 'support@dentalclinic.local';

const templates = [
  {
    name: 'password-reset' as const,
    subject: 'Reset your password',
    enVars: {
      firstName: 'Jana',
      resetUrl: 'https://frontend/reset-password?token=abc',
      expiresInMinutes: 60,
      clinicName,
      clinicEmail,
    },
    arVars: {
      firstName: 'جنى',
      resetUrl: 'https://frontend/reset-password?token=abc',
      expiresInMinutes: 60,
      clinicName,
      clinicEmail,
    },
    cta: 'https://frontend/reset-password?token=abc',
  },
  {
    name: 'appointment-confirmation' as const,
    subject: 'Appointment confirmed',
    enVars: {
      firstName: 'Jana',
      doctorName: 'Dr. Who',
      date: 'Monday, 19 May 2026',
      time: '10:00 AM',
      clinicName,
      clinicEmail,
      myAppointmentsUrl: 'https://frontend/my-appointments',
    },
    arVars: {
      firstName: 'جنى',
      doctorName: 'د. وِه',
      date: 'الاثنين، 19 مايو 2026',
      time: '10:00 صباحًا',
      clinicName,
      clinicEmail,
      myAppointmentsUrl: 'https://frontend/my-appointments',
    },
    cta: 'https://frontend/my-appointments',
  },
  {
    name: 'appointment-reminder' as const,
    subject: 'Appointment reminder',
    enVars: {
      firstName: 'Jana',
      doctorName: 'Dr. Who',
      date: 'Monday, 19 May 2026',
      time: '10:00 AM',
      hoursUntil: 24,
      clinicName,
      clinicEmail,
      myAppointmentsUrl: 'https://frontend/my-appointments',
    },
    arVars: {
      firstName: 'جنى',
      doctorName: 'د. وِه',
      date: 'الاثنين، 19 مايو 2026',
      time: '10:00 صباحًا',
      hoursUntil: 24,
      clinicName,
      clinicEmail,
      myAppointmentsUrl: 'https://frontend/my-appointments',
    },
    cta: 'https://frontend/my-appointments',
  },
  {
    name: 'waitlist-offer' as const,
    subject: 'Waitlist offer available',
    enVars: {
      firstName: 'Jana',
      doctorName: 'Dr. Who',
      date: 'Monday, 19 May 2026',
      time: '10:00 AM',
      offerUrl: 'https://frontend/offers/offer-1',
      expiresAt: '19 May 2026, 2:00 PM',
      clinicName,
      clinicEmail,
    },
    arVars: {
      firstName: 'جنى',
      doctorName: 'د. وِه',
      date: 'الاثنين، 19 مايو 2026',
      time: '10:00 صباحًا',
      offerUrl: 'https://frontend/offers/offer-1',
      expiresAt: '19 مايو 2026، 2:00 مساءً',
      clinicName,
      clinicEmail,
    },
    cta: 'https://frontend/offers/offer-1',
  },
];

describe('TemplateService', () => {
  const service = new TemplateService();

  service.onModuleInit();

  it.each(templates)('renders %s in English with safe layout', ({ name, subject, enVars, cta }) => {
    const rendered = service.render(name, 'en', enVars);

    expect(rendered.subject).toBe(subject);
    expect(rendered.html).toContain('max-width:600px');
    expect(rendered.html).toContain('width:100%');
    expect(rendered.html).toContain('background:#ffffff');
    expect(rendered.html).toContain('href="');
    expect(rendered.html).toContain(cta.split('?')[0]);
    expect(rendered.html).toContain(clinicEmail);
    expect(rendered.html).toContain(clinicName);
    expect(rendered.html).not.toContain('tracking');
    expect(rendered.text).toContain(clinicEmail);
  });

  it.each(templates)('renders %s in Arabic with RTL content', ({ name, arVars, cta }) => {
    const rendered = service.render(name, 'ar', arVars);

    expect(rendered.html).toContain('dir="rtl"');
    expect(rendered.html).toContain('text-align:right');
    expect(rendered.html).toContain('href="');
    expect(rendered.html).toContain(cta.split('?')[0]);
    expect(rendered.html).toContain(clinicEmail);
  });

  it('falls back to English when locale is unsupported', () => {
    const rendered = service.render('appointment-confirmation', 'fr', {
      firstName: 'Jana',
      doctorName: 'Dr. Who',
      date: 'Monday, 19 May 2026',
      time: '10:00 AM',
      clinicName,
      clinicEmail,
      myAppointmentsUrl: 'https://frontend/my-appointments',
    });

    expect(rendered.subject).toBe('Appointment confirmed');
    expect(rendered.text).toContain('confirmed for Monday, 19 May 2026 at 10:00 AM');
  });
});
