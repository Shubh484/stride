import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SafeUser } from './interfaces/auth-result.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: {
    register: jest.Mock;
    login: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
  };

  const sampleSafeUser: SafeUser = {
    id: 'user-uuid-1',
    email: 'athlete@example.com',
    username: 'athlete',
    displayName: 'Super Athlete',
    avatarUrl: null,
    bio: null,
    xp: 0,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleTokens = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresIn: '7d',
  };

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register and return response', async () => {
    const registerDto = {
      email: 'athlete@example.com',
      username: 'athlete',
      displayName: 'Super Athlete',
      password: 'SecurePassword123!',
    };
    mockAuthService.register.mockResolvedValue({
      user: sampleSafeUser,
      tokens: sampleTokens,
    });

    const result = await controller.register(registerDto);
    expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    expect(result.user.username).toBe('athlete');
  });

  it('should call authService.login and return response', async () => {
    const loginDto = {
      identifier: 'athlete',
      password: 'SecurePassword123!',
    };
    mockAuthService.login.mockResolvedValue({
      user: sampleSafeUser,
      tokens: sampleTokens,
    });

    const result = await controller.login(loginDto);
    expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    expect(result.tokens.accessToken).toBe('mock_access_token');
  });

  it('should call authService.refreshTokens', async () => {
    mockAuthService.refreshTokens.mockResolvedValue(sampleTokens);
    const result = await controller.refresh({ refreshToken: 'mock_refresh_token' });
    expect(mockAuthService.refreshTokens).toHaveBeenCalledWith({
      refreshToken: 'mock_refresh_token',
    });
    expect(result.accessToken).toBe('mock_access_token');
  });

  it('should call authService.logout', async () => {
    mockAuthService.logout.mockResolvedValue(undefined);
    const result = await controller.logout('user-uuid-1', {
      refreshToken: 'mock_refresh_token',
    });
    expect(mockAuthService.logout).toHaveBeenCalledWith('user-uuid-1', 'mock_refresh_token');
    expect(result.message).toBe('Logged out successfully');
  });

  it('should return profile for getProfile', () => {
    const result = controller.getProfile(sampleSafeUser);
    expect(result).toEqual({ user: sampleSafeUser });
  });
});
