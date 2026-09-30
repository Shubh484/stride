import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockPrismaService: { isHealthy: jest.Mock };
  let mockRedisService: { isHealthy: jest.Mock };
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockPrismaService = {
      isHealthy: jest.fn(),
    };
    mockRedisService = {
      isHealthy: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'nodeEnv') return 'test';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return ok when both database and redis are healthy', async () => {
    mockPrismaService.isHealthy.mockResolvedValue(true);
    mockRedisService.isHealthy.mockResolvedValue(true);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('connected');
    expect(result.services.redis).toBe('connected');
    expect(result.environment).toBe('test');
    expect(typeof result.uptime).toBe('number');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded when database is unhealthy', async () => {
    mockPrismaService.isHealthy.mockResolvedValue(false);
    mockRedisService.isHealthy.mockResolvedValue(true);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database).toBe('disconnected');
    expect(result.services.redis).toBe('connected');
  });

  it('should return degraded when redis is unhealthy', async () => {
    mockPrismaService.isHealthy.mockResolvedValue(true);
    mockRedisService.isHealthy.mockResolvedValue(false);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database).toBe('connected');
    expect(result.services.redis).toBe('disconnected');
  });
});
