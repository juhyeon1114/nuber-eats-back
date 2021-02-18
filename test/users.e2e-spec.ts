import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

// 테스트마다 email을 전송하지 않게 하기 위함
jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const EMAIL = 'juhyeon@gomiad.com';
const PASSWORD = 'rlawngus';
const NEW_EMAIL = 'juhyeon2@gomiad.com';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  // 모든 테스트 종료 후 실행
  afterAll(async () => {
    await getConnection().dropDatabase(); // test DB 드롭
    await app.close(); // app종료 (required)
  });

  // common functions
  const createTestAccount = (email, password) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .send({
        query: `
        mutation {
          createAccount(input: {
            email: "${email}",
            password: "${password}",
            role: Client
          }) {
            ok
            error
          }
        }
      `,
      });
  };

  const login = (email, password) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .send({
        query: `
      mutation {
        login(input: {
          email: "${email}",
          password: "${password}"
        }) {
          ok
          error
          token
        }
      }
    `,
      });
  };

  const getProfile = (id: number, token: string) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set(`x-jwt`, token)
      .send({
        query: `
          query {
              userProfile(userId: ${id}) {
                ok
                error
                user {
                  id
                }
              }
            }
        `,
      });
  };

  const me = (token) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set('x-jwt', token)
      .send({
        query: `
        query {
          me {
            email
          }
        }
      `,
      });
  };

  const editProfile = (email) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set('x-jwt', jwtToken)
      .send({
        query: `
            mutation {
              editProfile(input: {
                email: "${email}"
              }) {
                ok
                error
              }
            }
          `,
      });
  };

  describe('createAccount', () => {
    it('should create account', () => {
      return createTestAccount(EMAIL, PASSWORD)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', async () => {
      return createTestAccount(EMAIL, PASSWORD)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toEqual(expect.any(String));
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return login(EMAIL, PASSWORD)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should not be able to login with wrong credentials', () => {
      return login(EMAIL, 'wrongPassword')
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it('should see a user profile', () => {
      return getProfile(userId, jwtToken)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return getProfile(123123123, jwtToken).expect((res) => {
        const {
          body: {
            data: {
              userProfile: { ok, error, user },
            },
          },
        } = res;
        expect(ok).toBe(false);
        expect(error).toBe('user not found');
        expect(user).toBe(null);
      });
    });
  });

  describe('me', () => {
    it('should return my profile', () => {
      return me(jwtToken)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toEqual(EMAIL);
        });
    });

    it('should find my profile', () => {
      return me('wrongToken')
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    it('should change email', () => {
      return editProfile(NEW_EMAIL)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        })
        .then(() => {
          return me(jwtToken)
            .expect(200)
            .expect((res) => {
              const {
                body: {
                  data: {
                    me: { email },
                  },
                },
              } = res;
              expect(email).toEqual(NEW_EMAIL);
            });
        });
    });
  });

  describe('verifyEmail', () => {});
});
