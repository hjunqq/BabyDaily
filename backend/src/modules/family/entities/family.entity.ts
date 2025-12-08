import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { FamilyMember } from './family-member.entity';

@Entity('families')
export class Family {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    creator_id: string;

    @OneToMany(() => FamilyMember, (member) => member.family)
    members: FamilyMember[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
