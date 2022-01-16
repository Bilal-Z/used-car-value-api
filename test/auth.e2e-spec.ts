import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentication System (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('handles a signup request', async () => {
    const user = {
      email: 'test7@test.com',
      password: 'password',
    };

    const {
      body: { id, email },
    } = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(201);

    expect(id).toBeDefined();
    expect(email).toEqual(user.email);
  });
});
