import { User } from './entities/user.entity';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UsersService } from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      return this.usersService.createAccount(createAccountInput);
    } catch (error) {
      return { ok: false, error };
    }
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput) {
    try {
      return this.usersService.login(loginInput);
    } catch (error) {
      return { ok: false, error };
    }
  }

  // 1. jwtMiddleware를 통해서 jwt를 통해서 user를 decode해줌
  // 2. AuthGuard에서 user가 없으면 req를 멈춤 (authorization)
  // 3. @AuthUser를 통해서 인증을 통과한 user를 가져옴
  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User) {
    return authUser;
  }
}
