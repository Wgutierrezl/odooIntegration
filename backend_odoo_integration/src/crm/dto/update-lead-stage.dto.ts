import { IsNumber } from 'class-validator';

export class UpdateLeadStageDto {
  @IsNumber()
  stage_id: number;
}
