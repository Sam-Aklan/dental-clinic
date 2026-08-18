import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
	it('maps patientProfileId from the JWT payload into AuthenticatedUser', async () => {
		const strategy = new JwtStrategy({ getOrThrow: jest.fn().mockReturnValue('secret') } as unknown as ConfigService);

		await expect(
			strategy.validate({
				sub: 'user-1',
				email: 'patient@example.com',
				role: 'PATIENT',
				patientProfileId: 'patient-profile-1',
			}),
		).resolves.toEqual({
			userId: 'user-1',
			email: 'patient@example.com',
			role: 'PATIENT',
			doctorProfileId: null,
			patientProfileId: 'patient-profile-1',
		});
	});
});
