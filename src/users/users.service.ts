import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(email: string, password: string) {
    const user = this.repo.create({ email, password });

    return this.repo.save(user);
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('invalid id provided');
    }

    const user = await this.repo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }

  find(email: string) {
    return this.repo.find({ where: { email } });
  }

  async update(id: number, attr: Partial<User>) {
    const user = await this.findOne(id);

    Object.assign(user, attr);
    return this.repo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.repo.remove(user);
  }
}
