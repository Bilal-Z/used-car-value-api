import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
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

  it('should create a new user w a salted and hashed password', async () => {
    const password = '123456';
    const user = await service.signup('asdf@test.com', password);

    expect(user.password).not.toEqual(password);
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('should throw an error if user signs up with email that is in use', async () => {
    expect.assertions(1);
    await service.signup('test1@test.com', '123456');
    await expect(
      service.signup('test1@test.com', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw if signin is called with unused email', async () => {
    expect.assertions(1);
    await expect(
      service.signin('asdf@test.com', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw if invalid password provided', async () => {
    expect.assertions(1);
    await service.signup('test@test.com', 'password');

    await expect(
      service.signin('test@test.com', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return user if correct password provided', async () => {
    await service.signup('test@test.com', '123456');

    const user = await service.signin('test@test.com', '123456');
    expect(user).toBeDefined();
  });
});
