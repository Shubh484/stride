import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrismaService: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  const sampleUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'runner1',
    displayName: 'Runner One',
    passwordHash: 'hashed_pw',
    avatarUrl: null,
    bio: null,
    isActive: true,
    xp: 0,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by id', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(sampleUser);
    const result = await service.findById('user-123');
    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
    });
    expect(result).toEqual(sampleUser);
  });

  it('should find user by email with normalized lowercase', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(sampleUser);
    const result = await service.findByEmail('  Test@Example.COM  ');
    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(result).toEqual(sampleUser);
  });

  it('should find user by username with normalized lowercase', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(sampleUser);
    const result = await service.findByUsername('  Runner1 ');
    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'runner1' },
    });
    expect(result).toEqual(sampleUser);
  });

  it('should find user by email or username identifier', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(sampleUser);
    const result = await service.findByEmailOrUsername('runner1');
    expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ email: 'runner1' }, { username: 'runner1' }],
      },
    });
    expect(result).toEqual(sampleUser);
  });

  it('should create user with lowercase email and username', async () => {
    mockPrismaService.user.create.mockResolvedValue(sampleUser);
    const result = await service.create({
      email: 'Test@Example.COM',
      username: 'Runner1',
      displayName: 'Runner One',
      passwordHash: 'hashed_pw',
    });
    expect(mockPrismaService.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        username: 'runner1',
        displayName: 'Runner One',
        passwordHash: 'hashed_pw',
      },
    });
    expect(result).toEqual(sampleUser);
  });
});
