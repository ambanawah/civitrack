import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

// ── Mock UsersService ─────────────────────────────
const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  validatePassword: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

const mockUser = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CITIZEN',
  department: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  // ── register ─────────────────────────────────────
  describe('register', () => {
    it('should register a new user and return token', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });

    it('should call usersService.create with correct data', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  // ── login ─────────────────────────────────────────
  describe('login', () => {
    it('should login and return JWT token', async () => {
      const userWithPassword = { ...mockUser, password: 'hashed_password' };
      mockUsersService.findByEmail.mockResolvedValue(userWithPassword);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const userWithPassword = { ...mockUser, password: 'hashed_password' };
      mockUsersService.findByEmail.mockResolvedValue(userWithPassword);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not return password in response', async () => {
      const userWithPassword = { ...mockUser, password: 'hashed_password' };
      mockUsersService.findByEmail.mockResolvedValue(userWithPassword);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ── validateToken ─────────────────────────────────
  describe('validateToken', () => {
    it('should return user for valid token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-123', email: 'test@example.com' });
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await authService.validateToken('valid-token');

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(authService.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── getProfile ────────────────────────────────────
  describe('getProfile', () => {
    it('should return user profile by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await authService.getProfile('user-uuid-123');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-uuid-123');
    });
  });
});
