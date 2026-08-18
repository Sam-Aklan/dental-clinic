import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsMultipleOf(divisor: number, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsMultipleOf',
      target: object.constructor,
      propertyName,
      constraints: [divisor],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [constraint] = args.constraints as [number];
          return typeof value === 'number' && Number.isInteger(value) && value % constraint === 0;
        },
      },
    });
  };
}
