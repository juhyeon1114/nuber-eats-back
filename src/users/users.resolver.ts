import { User } from './entities/user.entity';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
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

  @Query(() => User)
  @UseGuards(AuthGuard) // authorization
  me(@AuthUser() authUser: User) {
    return authUser;
  }
}
