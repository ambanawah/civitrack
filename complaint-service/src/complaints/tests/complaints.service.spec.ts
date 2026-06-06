import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ComplaintsService } from '../complaints.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  complaint: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

const mockUser = {
  userId: 'user-uuid-123',
  email: 'citizen@example.com',
  role: 'CITIZEN',
  name: 'Test Citizen',
};

const mockComplaint = {
  id: 'complaint-uuid-123',
  citizenId: 'user-uuid-123',
  citizenEmail: 'citizen@example.com',
  citizenName: 'Test Citizen',
  title: 'Water pipe broken on Avenue Kennedy',
  description: 'There is a major water leak causing flooding on Avenue Kennedy street.',
  department: 'WATER',
  category: 'Water Supply Issue',
  priority: 'MEDIUM',
  status: 'PENDING',
  slaHours: 24,
  slaDeadline: new Date(Date.now() + 86400000),
  slaBreached: false,
  assignedOfficerId: null,
  assignedOfficerName: null,
  events: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ComplaintsService', () => {
  let complaintsService: ComplaintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    complaintsService = module.get<ComplaintsService>(ComplaintsService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────
  describe('create', () => {
    it('should create a complaint and auto-classify it', async () => {
      mockPrismaService.complaint.create.mockResolvedValue(mockComplaint);

      const result = await complaintsService.create(
        {
          title: 'Water pipe broken on Avenue Kennedy',
          description: 'There is a major water leak causing flooding on Avenue Kennedy street.',
        },
        mockUser,
        'Test Citizen',
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.complaint.create).toHaveBeenCalledTimes(1);
    });

    it('should auto-detect WATER department from keywords', async () => {
      mockPrismaService.complaint.create.mockResolvedValue(mockComplaint);

      await complaintsService.create(
        {
          title: 'Water leak on main street',
          description: 'There is a water pipe leaking near the market causing flooding.',
        },
        mockUser,
        'Test Citizen',
      );

      const createCall = mockPrismaService.complaint.create.mock.calls[0][0];
      expect(createCall.data.department).toBe('WATER');
    });

    it('should set SLA deadline based on department', async () => {
      mockPrismaService.complaint.create.mockResolvedValue(mockComplaint);

      await complaintsService.create(
        {
          title: 'Water pipe broken',
          description: 'Water pipe is leaking badly causing flooding on the street.',
        },
        mockUser,
        'Test Citizen',
      );

      const createCall = mockPrismaService.complaint.create.mock.calls[0][0];
      expect(createCall.data.slaDeadline).toBeDefined();
      expect(createCall.data.slaHours).toBeGreaterThan(0);
    });

    it('should create complaint event on creation', async () => {
      mockPrismaService.complaint.create.mockResolvedValue(mockComplaint);

      await complaintsService.create(
        {
          title: 'Road pothole on Boulevard',
          description: 'There is a large dangerous pothole on the main boulevard causing accidents.',
        },
        mockUser,
        'Test Citizen',
      );

      const createCall = mockPrismaService.complaint.create.mock.calls[0][0];
      expect(createCall.data.events.create).toBeDefined();
      expect(createCall.data.events.create.action).toBe('COMPLAINT_CREATED');
    });
  });

  // ── findOne ───────────────────────────────────────
  describe('findOne', () => {
    it('should return a complaint by id', async () => {
      mockPrismaService.complaint.findUnique.mockResolvedValue(mockComplaint);

      const result = await complaintsService.findOne('complaint-uuid-123');

      expect(result).toEqual(mockComplaint);
      expect(mockPrismaService.complaint.findUnique).toHaveBeenCalledWith({
        where: { id: 'complaint-uuid-123' },
        include: { events: { orderBy: { createdAt: 'asc' } } },
      });
    });

    it('should throw NotFoundException if complaint not found', async () => {
      mockPrismaService.complaint.findUnique.mockResolvedValue(null);

      await expect(complaintsService.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findMine ──────────────────────────────────────
  describe('findMine', () => {
    it('should return complaints for a specific citizen', async () => {
      mockPrismaService.complaint.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.complaint.findMany.mockResolvedValue([mockComplaint]);

      const result = await complaintsService.findMine('user-uuid-123');

      expect(result).toEqual([mockComplaint]);
      expect(mockPrismaService.complaint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { citizenId: 'user-uuid-123' },
        }),
      );
    });
  });

  // ── updateStatus ──────────────────────────────────
  describe('updateStatus', () => {
    it('should update complaint status', async () => {
      const updatedComplaint = { ...mockComplaint, status: 'IN_PROGRESS' as any };
      mockPrismaService.complaint.findUnique.mockResolvedValue(mockComplaint);
      mockPrismaService.complaint.update.mockResolvedValue(updatedComplaint);

      const result = await complaintsService.updateStatus(
        'complaint-uuid-123',
        { status: 'IN_PROGRESS' as any, note: 'Working on it' },
        { userId: 'officer-uuid', email: 'officer@example.com', role: 'OFFICER' },
        'Officer Name',
      );

      expect(result.status).toBe('IN_PROGRESS' as any);
      expect(mockPrismaService.complaint.update).toHaveBeenCalledTimes(1);
    });

    it('should log event when status changes', async () => {
      mockPrismaService.complaint.findUnique.mockResolvedValue(mockComplaint);
      mockPrismaService.complaint.update.mockResolvedValue({
        ...mockComplaint,
        status: 'RESOLVED' as any,
      });

      await complaintsService.updateStatus(
        'complaint-uuid-123',
        { status: 'RESOLVED' as any, note: 'Issue resolved' },
        { userId: 'officer-uuid', email: 'officer@example.com', role: 'OFFICER' },
        'Officer Name',
      );

      const updateCall = mockPrismaService.complaint.update.mock.calls[0][0];
      expect(updateCall.data.events.create.action).toBe('STATUS_CHANGED');
      expect(updateCall.data.events.create.newValue).toBe('RESOLVED' as any);
    });
  });

  // ── getStats ──────────────────────────────────────
  describe('getStats', () => {
    it('should return dashboard statistics', async () => {
      mockPrismaService.complaint.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.complaint.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(4)   // pending
        .mockResolvedValueOnce(3)   // inProgress
        .mockResolvedValueOnce(2)   // resolved
        .mockResolvedValueOnce(1);  // breached

      mockPrismaService.complaint.groupBy.mockResolvedValue([
        { department: 'WATER', _count: { department: 5 } },
        { department: 'ROADS', _count: { department: 3 } },
      ]);

      const result = await complaintsService.getStats();

      expect(result.total).toBe(10);
      expect(result.pending).toBe(4);
      expect(result.inProgress).toBe(3);
      expect(result.resolved).toBe(2);
      expect(result.slaBreached).toBe(1);
      expect(result.byDepartment).toHaveLength(2);
    });
  });
});
