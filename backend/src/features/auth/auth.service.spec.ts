import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: {
    findByEmail: jest.Mock;
    findByUsername: jest.Mock;
    findByEmailOrUsername: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
  };
  let mockPrismaService: {
    refreshToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let mockJwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };

  const sampleUser = {
    id: 'user-uuid-1',
    email: 'athlete@example.com',
    username: 'athlete',
    displayName: 'Super Athlete',
    passwordHash: 'hashed_password_value',
    avatarUrl: null,
    bio: null,
    isActive: true,
    xp: 0,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findByEmailOrUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockPrismaService = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'rt-1', revoked: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockJwtService = {
      signAsync: jest
        .fn()
        .mockImplementation((payload) => Promise.resolve(`jwt_mock_${payload.type}`)),
      verifyAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'jwt.secret') return 'test_secret_key_123456789012345678';
        if (key === 'jwt.expiresIn') return '7d';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'athlete@example.com',
      username: 'athlete',
      displayName: 'Super Athlete',
      password: 'SecurePassword123!',
    };

    it('should register a new user successfully and return tokens without passwordHash', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_value');
      mockUsersService.create.mockResolvedValue(sampleUser);

      const result = await service.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.username).toBe('athlete');
      expect(result.tokens.accessToken).toBe('jwt_mock_access');
      expect(result.tokens.refreshToken).toBe('jwt_mock_refresh');
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(sampleUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username is already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(sampleUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      identifier: 'athlete',
      password: 'SecurePassword123!',
    };

    it('should successfully log in with valid credentials', async () => {
      mockUsersService.findByEmailOrUsername.mockResolvedValue(sampleUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmailOrUsername).toHaveBeenCalledWith(loginDto.identifier);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, sampleUser.passwordHash);
      expect(result.user.username).toBe('athlete');
      expect(result.tokens.accessToken).toBe('jwt_mock_access');
      expect(result.tokens.refreshToken).toBe('jwt_mock_refresh');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmailOrUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockUsersService.findByEmailOrUsername.mockResolvedValue({
        ...sampleUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUsersService.findByEmailOrUsername.mockResolvedValue(sampleUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully rotate tokens with a valid refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        email: 'athlete@example.com',
        username: 'athlete',
        type: 'refresh',
      });
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-uuid-1',
        revoked: false,
      });
      mockUsersService.findById.mockResolvedValue(sampleUser);

      const result = await service.refreshTokens({ refreshToken: 'valid_refresh_token' });

      expect(result.accessToken).toBe('jwt_mock_access');
      expect(result.refreshToken).toBe('jwt_mock_refresh');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
          tokenHash: expect.any(String),
        },
        data: { revoked: true },
      });
    });

    it('should throw UnauthorizedException if token is not of type refresh', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        type: 'access',
      });

      await expect(
        service.refreshTokens({ refreshToken: 'access_token_passed_by_mistake' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is not found or revoked', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        type: 'refresh',
      });
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshTokens({ refreshToken: 'revoked_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke all tokens for the user if no specific token provided', async () => {
      await service.logout('user-uuid-1');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
          revoked: false,
        },
        data: { revoked: true },
      });
    });
  });
});
