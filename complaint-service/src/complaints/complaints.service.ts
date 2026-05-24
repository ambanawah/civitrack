import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignOfficerDto } from './dto/assign-officer.dto';
import { classifyComplaint } from './classification.engine';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────
  async create(dto: CreateComplaintDto, user: AuthUser, citizenName: string) {
    // Auto-classify the complaint
    const classification = classifyComplaint(
      dto.title,
      dto.description,
      dto.department,
    );

    const now = new Date();
    const slaDeadline = new Date(
      now.getTime() + classification.slaHours * 60 * 60 * 1000,
    );

    const complaint = await this.prisma.complaint.create({
      data: {
        citizenId: user.userId,
        citizenEmail: user.email,
        citizenName: citizenName || 'Unknown',
        title: dto.title,
        description: dto.description,
        department: classification.department as any,
        category: classification.category,
        priority: classification.priority as any,
        slaHours: classification.slaHours,
        slaDeadline,
        events: {
          create: {
            actorId: user.userId,
            actorName: citizenName || user.email,
            actorRole: user.role,
            action: 'COMPLAINT_CREATED',
            newValue: 'PENDING',
            note: `Auto-classified as ${classification.category} (${classification.department}) with ${classification.priority} priority. SLA: ${classification.slaHours}h`,
          },
        },
      },
      include: { events: true },
    });

    return complaint;
  }

  // ──────────────────────────────────────────
  // GET ALL (with filters)
  // ──────────────────────────────────────────
  async findAll(query: {
    status?: string;
    department?: string;
    priority?: string;
    slaBreached?: string;
    citizenId?: string;
  }) {
    // Check and update SLA breaches before returning
    await this.checkSlaBreaches();

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.priority) where.priority = query.priority;
    if (query.slaBreached === 'true') where.slaBreached = true;
    if (query.citizenId) where.citizenId = query.citizenId;

    return this.prisma.complaint.findMany({
      where,
      include: { events: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────
  // GET MY COMPLAINTS (citizen)
  // ──────────────────────────────────────────
  async findMine(userId: string) {
    await this.checkSlaBreaches();

    return this.prisma.complaint.findMany({
      where: { citizenId: userId },
      include: { events: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────
  // GET BY DEPARTMENT (for officers)
  // ──────────────────────────────────────────
  async findByDepartment(department: string) {
    await this.checkSlaBreaches();

    return this.prisma.complaint.findMany({
      where: { department: department.toUpperCase() as any },
      include: { events: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: [{ slaBreached: 'desc' }, { createdAt: 'asc' }],
    });
  }

  // ──────────────────────────────────────────
  // GET ONE
  // ──────────────────────────────────────────
  async findOne(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  // ──────────────────────────────────────────
  // UPDATE STATUS (officer/admin only)
  // ──────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateStatusDto, user: AuthUser, actorName: string) {
    const complaint = await this.findOne(id);

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: dto.status as any,
        events: {
          create: {
            actorId: user.userId,
            actorName: actorName || user.email,
            actorRole: user.role,
            action: 'STATUS_CHANGED',
            oldValue: complaint.status,
            newValue: dto.status,
            note: dto.note,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return updated;
  }

  // ──────────────────────────────────────────
  // ASSIGN OFFICER (admin only)
  // ──────────────────────────────────────────
  async assignOfficer(id: string, dto: AssignOfficerDto, user: AuthUser) {
    await this.findOne(id);

    return this.prisma.complaint.update({
      where: { id },
      data: {
        assignedOfficerId: dto.officerId,
        assignedOfficerName: dto.officerName,
        status: 'IN_PROGRESS',
        events: {
          create: {
            actorId: user.userId,
            actorName: 'Admin',
            actorRole: user.role,
            action: 'ASSIGNED',
            newValue: dto.officerName,
            note: `Assigned to officer: ${dto.officerName}`,
          },
        },
      },
      include: { events: true },
    });
  }

  // ──────────────────────────────────────────
  // SLA BREACH CHECK (runs on every list call)
  // ──────────────────────────────────────────
  async checkSlaBreaches() {
    const now = new Date();

    // Find unresolved complaints whose deadline has passed
    await this.prisma.complaint.updateMany({
      where: {
        slaDeadline: { lt: now },
        slaBreached: false,
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
      },
      data: { slaBreached: true },
    });
  }

  // ──────────────────────────────────────────
  // GET SLA BREACHES (admin dashboard)
  // ──────────────────────────────────────────
  async getSlaBreaches() {
    await this.checkSlaBreaches();

    return this.prisma.complaint.findMany({
      where: {
        slaBreached: true,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
      orderBy: { slaDeadline: 'asc' },
    });
  }

  // ──────────────────────────────────────────
  // STATS (admin dashboard)
  // ──────────────────────────────────────────
  async getStats() {
    await this.checkSlaBreaches();

    const [total, pending, inProgress, resolved, breached] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.complaint.count({ where: { status: 'PENDING' } }),
      this.prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      this.prisma.complaint.count({ where: { slaBreached: true } }),
    ]);

    const byDepartment = await this.prisma.complaint.groupBy({
      by: ['department'],
      _count: { department: true },
    });

    return {
      total,
      pending,
      inProgress,
      resolved,
      slaBreached: breached,
      byDepartment: byDepartment.map((d) => ({
        department: d.department,
        count: d._count.department,
      })),
    };
  }
}
