import { ApiProperty } from '@nestjs/swagger';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';

export class ActionPlanStatusResponseDto {
  @ApiProperty({
    description: 'Action plan identifier.',
    example: '283c9543-caff-47c9-8dc6-2b88c8cac634',
  })
  id: string;

  @ApiProperty({
    description: 'Current action plan status.',
    enum: ActionPlanStatusEnum,
    example: ActionPlanStatusEnum.IN_PROGRESS,
  })
  status: ActionPlanStatusEnum;
}
