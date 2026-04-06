import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Family } from './family.entity';
import { User } from '../../users/entities/user.entity';
import { FamilyRole } from './family-member.entity';

@Entity('family_invites')
export class FamilyInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  family_id: string;

  @Column({ length: 8, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: FamilyRole,
    default: FamilyRole.MEMBER,
  })
  role: FamilyRole;

  @Column()
  created_by: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ nullable: true })
  used_by: string;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn()
  created_at: Date;
}
