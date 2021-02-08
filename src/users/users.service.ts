import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<string | undefined> {
    // check new user
    // ? create user & hash the password
    // : return something

    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return 'There is a user with that email already';
      }
      await this.users.save(this.users.create({ email, password, role }));
    } catch (error) {
      console.error(error);
      return 'Could not create account';
    }
  }
}
