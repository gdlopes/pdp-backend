import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateActionPlanDto {
  @ApiProperty({
    description: 'Action plan title.',
    example: 'Kubernetes',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'What specific outcome or result do you want to achieve?',
    example: 'Deploy and manage a Kubernetes cluster in production.',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  specificGoal: string;

  @ApiProperty({
    description: 'Target completion date for the plan.',
    example: '2025-12-31',
    type: String,
    format: 'date',
    required: true,
  })
  @Type(() => Date)
  @IsDate()
  deadline: Date;

  @ApiProperty({
    description: 'Tools, skills, budget, or support needed.',
    example: 'Online courses, documentation, and a lab environment.',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  resources: string;

  @ApiProperty({
    description: 'How progress is measured and what proves the goal is done.',
    example: 'Weekly labs completed; CKA exam passed.',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  successIndicator: string;

  @ApiProperty({
    description: 'Reward for completing the plan.',
    example: 'Take a weekend trip to celebrate.',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  rewards: string;
}
