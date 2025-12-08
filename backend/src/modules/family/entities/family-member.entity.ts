import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Family } from './family.entity';
import { User } from '../../users/entities/user.entity';

export enum FamilyRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    VIEWER = 'VIEWER',
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
