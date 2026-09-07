import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Identifier of the action plan this task belongs to.',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
    type: String,
    required: true,
  })
  @Transform(({ value }) => (typeof value === 'number' ? String(value) : value))
  @IsString()
  @IsNotEmpty()
  actionPlanId: string;

  @ApiProperty({
    description: 'Task description.',
    example: 'Complete the Kubernetes introductory course.',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
