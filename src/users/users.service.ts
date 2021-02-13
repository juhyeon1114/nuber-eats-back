import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService, // JwtModule을 global module로 만들었기 때문에 usersModule에 import 하지 않고 사용할 수 있다
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // check new user
    // ? create user & hash the password
    // : return something

    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Could not create account' };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // find the user with the email
    // check if the password is correct
    // make a JWT and give it to the user
    try {
      const user = await this.users.findOne({ email });
      if (!user) return { ok: false, error: 'User not found' };

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) return { ok: false, error: 'Wrong password' };

      // const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
      // const token = jwt.sign({ id: user.id }, this.config.get('SECRET_KEY'));
      const token = this.jwtService.sign(user.id);

      return { ok: true, token };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  async editProfile(userId: number, { email, password }: EditProfileInput) {
    // return this.users.update(userId, { ...editProfileInput }); // update하는 쿼리를 날림 -> @BeforeUpdate훅이 동작하지 않음

    const user = await this.users.findOne(userId);
    email ? (user.email = email) : {};
    password ? (user.password = password) : {};
    return this.users.save(user);
  }
}
