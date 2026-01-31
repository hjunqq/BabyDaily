import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Family } from '../../family/entities/family.entity';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

@Entity('babies')
export class Baby {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    family_id: string;

    @Column()
    name: string;

    @Column({
        type: 'simple-enum',
        enum: Gender,
    })
    gender: Gender;
    @Column()
    birthday: Date;

    @Column({ nullable: true })
    blood_type: string;

    @Column({ nullable: true })
    avatar_url: string;

    @ManyToOne(() => Family)
    @JoinColumn({ name: 'family_id' })
    family: Family;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
