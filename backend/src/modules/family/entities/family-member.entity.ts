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

export enum FamilyRole {
  OWNER = 'OWNER',
  GUARDIAN = 'GUARDIAN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/** Role hierarchy: OWNER > GUARDIAN > MEMBER > VIEWER */
export const ROLE_HIERARCHY: Record<FamilyRole, number> = {
  [FamilyRole.OWNER]: 40,
  [FamilyRole.GUARDIAN]: 30,
  [FamilyRole.MEMBER]: 20,
  [FamilyRole.VIEWER]: 10,
};

export enum MemberStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
}

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  family_id: string;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: FamilyRole,
    default: FamilyRole.MEMBER,
  })
  role: FamilyRole;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE,
  })
  status: MemberStatus;

  @Column({ nullable: true })
  relation: string;

  @ManyToOne(() => Family, (family) => family.members)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
