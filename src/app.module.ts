import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import * as Joi from 'joi'; //js 패키지를 ts에 import 하는 법
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Category } from './restaurants/entities/category.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { Dish } from './restaurants/entities/dish.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // config에 어디서든 접근할 수 있음
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod', // production 환경일 땐, env파일 무시
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        PRIVATE_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
      }), // 환경변수 유효성 검사
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Verification, Restaurant, Category, Dish], // typeorm으로 관리할 entity를 입력해주면 됨
      synchronize: process.env.NODE_ENV !== 'prod', // DB를 자동으로 typeOrmModule의 상태로 마이그레이션
      logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test', // DB에서 일어나는 일을 logging
    }),
    GraphQLModule.forRoot({
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // 스키마 파일을 자동으로 생성
      autoSchemaFile: true, // 스키마를 자동으로 생성해서 메모리에 갖고 있음
      context: ({ req }) => ({ user: req['user'] }), // context는 모든 resolver에서 접근할 수 있는 함수이다. 인자에는 request가 있고, 이 request도 모든 resolver에서 접근 가능하다.
    }),
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),

    /**
     * 이상, Dynamic Module : 설정이 적용되어 있는 모듈
     * 이하, Static Module
     */
    AuthModule,
    UsersModule,
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  // middleware를 쓰는 법 2
  configure(consumer: MiddlewareConsumer) {
    // JwtMiddleware를 /graphql이라는 경로에서 POST 메서드에 적용
    consumer
      .apply(JwtMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.POST });
  }
}
