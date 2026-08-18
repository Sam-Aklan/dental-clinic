import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'WaitlistWindowPair', async: false })
export class WaitlistWindowPairConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const target = args.object as { availableFrom?: string | null; availableUntil?: string | null };
    const hasFrom = target.availableFrom !== undefined && target.availableFrom !== null;
    const hasUntil = target.availableUntil !== undefined && target.availableUntil !== null;
    return (hasFrom && hasUntil) || (!hasFrom && !hasUntil);
  }

  defaultMessage(): string {
    return 'window_incomplete';
  }
}

export function WaitlistWindowPair(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: WaitlistWindowPairConstraint,
    });
  };
}
