import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import UsersEntity from './users.entity';

export enum ActionPlanStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'action_plans' })
export default class ActionPlansEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', name: 'specific_goal' })
  specificGoal: string;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ type: 'varchar' })
  resources: string;

  @Column({ type: 'varchar', name: 'success_indicator' })
  successIndicator: string;

  @Column({ type: 'varchar' })
  rewards: string;

  @Column({ type: 'varchar', enum: ActionPlanStatusEnum })
  status: ActionPlanStatusEnum;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @ManyToOne(() => UsersEntity)
  @JoinColumn({ name: 'user_id' })
  user: UsersEntity;
}
