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
        const user = this.usersRepository.create({ openid, nickname, avatar_url });
        return this.usersRepository.save(user);
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, updateData);
        return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
    }
}
