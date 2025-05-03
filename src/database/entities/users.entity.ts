import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'users' })
export default class UsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'timestamp', name: 'created_at', default: new Date() })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at', default: new Date() })
  updatedAt: Date;
}
