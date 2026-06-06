import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockUser = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  password: 'hashed_password',
  name: 'Test User',
  role: 'CITIZEN',
  department: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────
  describe('create', () => {
    it('should create a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await usersService.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        usersService.create({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password before saving', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await usersService.create({
        email: 'test@example.com',
        password: 'plaintext_password',
        name: 'Test User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext_password', 10);
    });
  });

  // ── findByEmail ───────────────────────────────────
  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  // ── findById ──────────────────────────────────────
  describe('findById', () => {
    it('should return user by id without password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findById('user-uuid-123');

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('user-uuid-123');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(usersService.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── validatePassword ──────────────────────────────
  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await usersService.validatePassword('password123', 'hashed_password');

      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await usersService.validatePassword('wrongpassword', 'hashed_password');

      expect(result).toBe(false);
    });
  });
});
