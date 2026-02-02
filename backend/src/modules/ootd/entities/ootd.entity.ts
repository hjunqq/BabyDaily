import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Baby } from '../../baby/entities/baby.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ootd')
@Index('idx_ootd_baby_date', ['baby_id', 'date'])
export class Ootd {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    baby_id: string;

    @Column()
    creator_id: string;

    @Column()
    image_url: string;

    @Column({ nullable: true })
    thumbnail_url: string;

    @Column({ type: 'date' })
    date: Date;

    @Column('text', { array: true, nullable: true })
    tags: string[];

    @Column({ nullable: true })
    remark: string;

    @Column({ type: 'int', default: 0 })
    likes: number;

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
