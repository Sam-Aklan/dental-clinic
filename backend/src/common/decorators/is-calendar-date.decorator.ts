import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

const CALENDAR_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function IsCalendarDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsCalendarDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string' || !CALENDAR_DATE_REGEX.test(value)) {
            return false;
          }

          const parsed = new Date(`${value}T00:00:00.000Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
        },
      },
    });
  };
}
