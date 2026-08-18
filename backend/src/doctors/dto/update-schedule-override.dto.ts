import { PartialType } from '@nestjs/swagger';
import { CreateScheduleOverrideDto } from './create-schedule-override.dto';

export class UpdateScheduleOverrideDto extends PartialType(CreateScheduleOverrideDto) {}
