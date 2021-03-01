import { ExecutionContext } from '@nestjs/common';
import { CanActivate, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { AllowedRole } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRole>(
      'roles',
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    // http context를 graphql context로 만들어줌
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      try {
        if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
          const { user } = await this.usersService.findById(decoded['id']);
          if (!user) {
            return false;
          }
          gqlContext['user'] = user;
          return roles.includes(user.role) || roles.includes('Any');
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    } else {
      return false;
    }
  }
}
