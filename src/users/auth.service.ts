import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // see if email in use
    const users = await this.usersService.find(email);

    if (users.length) {
      throw new ConflictException('email in use');
    }
    // hash user password
    // generate random salt
    const salt = randomBytes(8).toString('hex');

    // hash salt and password together
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // join hashed result and salt
    const result = `${salt}.${hash.toString('hex')}`;

    // create new user
    const user = await this.usersService.create(email, result);

    // return user
    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const [salt, storedHash] = user.password.split('.');

    // hash salt and password together
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('wrong password');
    }

    return user;
  }
}
