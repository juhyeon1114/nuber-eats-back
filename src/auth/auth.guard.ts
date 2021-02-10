import { ExecutionContext } from '@nestjs/common';
import { CanActivate, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // http context를 graphql context로 만들어줌
    const gqlContext = GqlExecutionContext.create(context).getContext();
    return gqlContext.user ? true : false;
  }
}
