import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';
import { Locale } from '../../generated/prisma/enums';

describe('RegisterDto', () => {
  const validPayload = {
    email: 'patient@example.com',
    password: 'SecurePass1',
    firstName: 'Jane',
    lastName: 'Doe',
    preferredLocale: Locale.EN,
  };

  async function getErrors(payload: Record<string, unknown>) {
    const dto = plainToInstance(RegisterDto, payload);
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  describe('valid payload', () => {
    it('should pass validation', async () => {
      const errors = await validate(plainToInstance(RegisterDto, validPayload));
      expect(errors).toHaveLength(0);
    });
  });

  describe('email', () => {
    it('should reject invalid email', async () => {
      const errors = await getErrors({ ...validPayload, email: 'not-an-email' });
      expect(errors).toContain('email must be an email');
    });

    it('should reject missing email', async () => {
      const { email, ...rest } = validPayload;
      const errors = await getErrors(rest);
      expect(errors).toContain('email must be an email');
    });
  });

  describe('password', () => {
    it('should reject password under 8 characters', async () => {
      const errors = await getErrors({ ...validPayload, password: 'Ab1' });
      expect(errors).toContain('password must be longer than or equal to 8 characters');
    });

    it('should reject password over 72 characters', async () => {
      const errors = await getErrors({
        ...validPayload,
        password: 'A1' + 'a'.repeat(71),
      });
      expect(errors).toContain('password must be shorter than or equal to 72 characters');
    });

    it('should reject password missing uppercase', async () => {
      const errors = await getErrors({ ...validPayload, password: 'securepass1' });
      expect(errors).toContain('password must contain at least one uppercase letter');
    });

    it('should reject password missing digit', async () => {
      const errors = await getErrors({ ...validPayload, password: 'SecurePass' });
      expect(errors).toContain('password must contain at least one digit');
    });

    it('should reject empty password', async () => {
      const errors = await getErrors({ ...validPayload, password: '' });
      expect(errors.some((m) => m.includes('password'))).toBe(true);
    });
  });

  describe('firstName', () => {
    it('should reject empty firstName', async () => {
      const errors = await getErrors({ ...validPayload, firstName: '' });
      expect(errors).toContain('firstName must be longer than or equal to 1 characters');
    });

    it('should reject firstName over 50 characters', async () => {
      const errors = await getErrors({
        ...validPayload,
        firstName: 'A'.repeat(51),
      });
      expect(errors).toContain('firstName must be shorter than or equal to 50 characters');
    });

    it('should reject missing firstName', async () => {
      const { firstName, ...rest } = validPayload;
      const errors = await getErrors(rest);
      expect(errors).toContain('firstName must be a string');
    });
  });

  describe('lastName', () => {
    it('should reject empty lastName', async () => {
      const errors = await getErrors({ ...validPayload, lastName: '' });
      expect(errors).toContain('lastName must be longer than or equal to 1 characters');
    });

    it('should reject lastName over 50 characters', async () => {
      const errors = await getErrors({
        ...validPayload,
        lastName: 'B'.repeat(51),
      });
      expect(errors).toContain('lastName must be shorter than or equal to 50 characters');
    });
  });

  describe('preferredLocale', () => {
    it('should accept omitted preferredLocale', async () => {
      const { preferredLocale, ...rest } = validPayload;
      const errors = await validate(plainToInstance(RegisterDto, rest));
      expect(errors).toHaveLength(0);
    });

    it('should accept Locale.EN', async () => {
      const errors = await getErrors({ ...validPayload, preferredLocale: Locale.EN });
      expect(errors).toHaveLength(0);
    });

    it('should accept Locale.AR', async () => {
      const errors = await getErrors({ ...validPayload, preferredLocale: Locale.AR });
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid preferredLocale', async () => {
      const errors = await getErrors({ ...validPayload, preferredLocale: 'FR' });
      expect(errors).toContain('preferredLocale must be one of the following values: EN, AR');
    });
  });

  describe('unknown extra fields', () => {
    it('should strip unknown fields when whitelist is applied via validation context', async () => {
      const dto = plainToInstance(RegisterDto, {
        ...validPayload,
        extraField: 'should be stripped',
      });
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      expect(messages).toContain('property extraField should not exist');
    });
  });
});
