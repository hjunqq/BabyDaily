import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_settings')
export class UserSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    user_id: string;

    @Column({ default: 'B' })
    theme: string;

    @Column({ default: 'zh-CN' })
    language: string;

    @Column({ default: 'CSV' })
    export_format: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
