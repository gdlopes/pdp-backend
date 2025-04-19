import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import UsersEntity from './users.entity';

enum CurrentLevelEnum {
  BEGINNER = 'BEGINNER',
  INTERMEDIARY = 'INTERMEDIARY',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

enum ExpectedLevelEnum {
  ACHIEVE_NEXT_LEVEL = 'ACHIEVE_NEXT_LEVEL',
  ENHANCE_CURRENT_LEVEL = 'ENHANCE_CURRENT_LEVEL',
}

enum ReviewCommitmentEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

@Entity()
export default class ActionPlansEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  goal: string;

  @Column({ type: 'varchar', name: 'alignment_with_life_career' })
  alignmentWithLifeCareer: string;

  @Column({ type: 'varchar' })
  motivation: string;

  @Column({ type: 'enum', name: 'current_level', enum: CurrentLevelEnum })
  currentLevel: string;

  @Column({ type: 'enum', name: 'expected_level', enum: ExpectedLevelEnum })
  expectedLevel: string;

  @Column({ type: 'varchar', name: 'specific_goal' })
  specificGoal: string;

  @Column({ type: 'varchar', name: 'progress_tracking_method' })
  progressTrackingMethod: string;

  @Column({ type: 'varchar' })
  resources: string;

  @Column({ type: 'varchar', name: 'development_impact' })
  developmentImpact: string;

  @Column({ type: 'timestamp', name: 'estimated_completion_date' })
  estimatedCompletionDate: Date;

  @Column({ type: 'varchar', name: 'learning_method' })
  learningMethod: string;

  @Column({ type: 'varchar', name: 'time_commitment' })
  timeCommitment: number;

  @Column({ type: 'varchar', name: 'knowledge_application' })
  knowledgeApplication: string;

  @Column({ type: 'varchar' })
  rewards: string;

  @Column({
    type: 'enum',
    name: 'review_commitment',
    enum: ReviewCommitmentEnum,
  })
  reviewCommitment: string;

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
