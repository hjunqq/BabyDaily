import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Baby } from '../../baby/entities/baby.entity';
import { User } from '../../users/entities/user.entity';

export enum RecordType {
    FEED = 'FEED',
    SLEEP = 'SLEEP',
    DIAPER = 'DIAPER',
    BATH = 'BATH',
    HEALTH = 'HEALTH',
    GROWTH = 'GROWTH',
    MILESTONE = 'MILESTONE',
    VITA_AD = 'VITA_AD',
    VITA_D3 = 'VITA_D3',
}

@Entity('records')
@Index('idx_records_baby_time', ['baby_id', 'time'])
@Index('idx_records_baby_type_time', ['baby_id', 'type', 'time'])
export class Record {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    baby_id: string;

    @Column()
    creator_id: string;

    @Column({
        type: 'enum',
        enum: RecordType,
    })
    type: RecordType;

    @Column()
    time: Date;

    @Column({ nullable: true })
    end_time: Date;

    @Column('jsonb', { nullable: true })
    details: any;

    @Column('text', { array: true, nullable: true })
    media_urls: string[];

    @Column({ nullable: true })
    remark: string;

    @ManyToOne(() => Baby)
    @JoinColumn({ name: 'baby_id' })
    baby: Baby;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'creator_id' })
    creator: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
