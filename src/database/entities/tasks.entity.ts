import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import ActionPlansEntity from './action-plans.entity';

enum TaskStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity()
export default class TasksEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'varchar', enum: TaskStatusEnum })
  status: string;

  @ManyToOne(() => ActionPlansEntity)
  @JoinColumn({ name: 'action_plan_id' })
  actionPlan: ActionPlansEntity;

  @Column({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
