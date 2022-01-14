import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // see if email is in use
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('email already in use');
    }

    // hash password
    // 1 -- generate salt
    const salt = randomBytes(8).toString('hex');

    // 2 -- hash salt and password together
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // 3 -- join hashed result and salt together
    const result = `${salt}.${hash.toString('hex')}`;

    // create user and save
    const user = await this.usersService.create(email, result);

    // return user
    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new BadRequestException('invalid credentials');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('invalid credentials');
    }

    return user;
  }
}
