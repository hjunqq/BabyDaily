import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOneByOpenid(openid: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { openid } });
    }

    async create(openid: string, nickname?: string, avatar_url?: string): Promise<User> {
        // 先查询是否已存在
        const existing = await this.findOneByOpenid(openid);
        if (existing) {
            return existing;
        }

        const user = this.usersRepository.create({ openid, nickname, avatar_url });
        try {
            return await this.usersRepository.save(user);
        } catch (error: any) {
            // UNIQUE 约束失败，说明用户已被其他进程创建，重新查询
            const message = String(error?.message ?? '');
            if (message.includes('UNIQUE constraint failed') && message.includes('users.openid')) {
                // 等待后重新查询，确保获取到新创建的用户
                await new Promise(resolve => setTimeout(resolve, 50));
                const found = await this.findOneByOpenid(openid);
                if (found) return found;
            }
            throw error;
        }
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, updateData);
        return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
    }
}
