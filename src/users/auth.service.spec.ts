import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('test@test.com', 'pass');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if users signup with email already in use', async () => {
    await service.signup('test@test.com', 'pass');
    await expect(service.signup('test@test.com', 'pass')).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws an error if signin is called with unused email', async () => {
    await expect(service.signin('test@test.com', 'pass')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws an error if provided an invalid password', async () => {
    await service.signup('test@test.com', 'pass');
    await expect(service.signin('test@test.com', 'password')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('test@test.com', 'mypass');

    const user = await service.signin('test@test.com', 'mypass');
    expect(user).toBeDefined();
  });
});
