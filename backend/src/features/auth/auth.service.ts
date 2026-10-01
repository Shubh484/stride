import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthResponse,
  AuthTokens,
  SafeUser,
} from './interfaces/auth-result.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>(
      'jwt.secret',
      'super_secret_social_fitness_jwt_key_32_chars_min!',
    );
    this.jwtExpiresIn = this.configService.get<string>('jwt.expiresIn', '7d');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'A user with this email already exists',
      });
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException({
        code: 'USERNAME_ALREADY_EXISTS',
        message: 'A user with this username already exists',
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
    });

    const tokens = await this.generateAndStoreTokens(user);
    const safeUser = this.sanitizeUser(user);

    this.logger.log(`New user registered: ${user.username} (${user.id})`);

    return {
      user: safeUser,
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email/username or password',
      });
    }

    let isPasswordValid = false;
    try {
      if (user.passwordHash && typeof user.passwordHash === 'string') {
        isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      }
    } catch (err) {
      this.logger.warn(`Password comparison error for user ${user.id}: ${(err as Error).message}`);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email/username or password',
      });
    }

    const tokens = await this.generateAndStoreTokens(user);
    const safeUser = this.sanitizeUser(user);

    this.logger.log(`User logged in: ${user.username} (${user.id})`);

    return {
      user: safeUser,
      tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is expired or invalid',
      });
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN_TYPE',
        message: 'Token provided is not a refresh token',
      });
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException({
        code: 'REVOKED_REFRESH_TOKEN',
        message: 'Refresh token has been revoked or has expired',
      });
    }

    // Revoke used refresh token (token rotation)
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: payload.sub,
        tokenHash,
      },
      data: { revoked: true },
    });

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: 'User account is inactive or not found',
      });
    }

    return this.generateAndStoreTokens(user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          tokenHash,
        },
        data: { revoked: true },
      });
    } else {
      // Revoke all active tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revoked: false,
        },
        data: { revoked: true },
      });
    }
  }

  private async generateAndStoreTokens(user: User): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
      jti: crypto.randomUUID(),
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      type: 'refresh',
      jti: crypto.randomUUID(),
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as any,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.jwtSecret,
      expiresIn: '30d',
    });

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtExpiresIn,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  sanitizeUser(user: User): SafeUser {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
