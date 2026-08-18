import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

const IANA_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsIanaTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === 'string' && (value === 'UTC' || IANA_TIMEZONES.has(value));
        },
      },
    });
  };
}
