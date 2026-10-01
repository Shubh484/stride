import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `e2e_runner_${Date.now()}@example.com`,
    username: `e2e_runner_${Date.now()}`,
    displayName: 'E2E Test Runner',
    password: 'SuperSecurePassword123!',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up test user
    try {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    } catch {
      // Ignore cleanup error if user was not created
    }
    await app.close();
  });

  it('POST /api/v1/auth/register - should register a new user successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.username).toBe(testUser.username.toLowerCase());
    expect(res.body.data.user.displayName).toBe(testUser.displayName);
    expect(res.body.data.user.xp).toBe(0);
    expect(res.body.data.user.level).toBe(1);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('POST /api/v1/auth/register - should reject registration with duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        username: `diff_${Date.now()}`,
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('POST /api/v1/auth/register - should reject registration with invalid email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        email: 'invalid-email',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login - should login with email and valid password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.username).toBe(testUser.username.toLowerCase());
  });

  it('POST /api/v1/auth/login - should login with username and valid password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: testUser.username,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('POST /api/v1/auth/login - should reject login with invalid password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: testUser.email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/v1/auth/me - should reject unauthenticated request', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me - should return user profile with valid Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.username).toBe(testUser.username.toLowerCase());
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('POST /api/v1/auth/refresh - should rotate tokens with valid refresh token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Verify old refresh token is now revoked
    const retryRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(retryRes.body.success).toBe(false);
  });

  it('POST /api/v1/auth/logout - should log out successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Logged out successfully');
  });
});
