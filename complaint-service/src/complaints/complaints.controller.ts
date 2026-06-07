import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignOfficerDto } from './dto/assign-officer.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard, Roles } from './guards/roles.guard';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  // ──────────────────────────────────────────
  // POST /complaints
  // Citizen submits a complaint
  // ──────────────────────────────────────────
  @Post()
  async create(
    @Body() dto: CreateComplaintDto,
    @Request() req,
    @Headers('x-user-name') citizenName: string,
  ) {
    return this.complaintsService.create(dto, req.user, citizenName);
  }

  // ──────────────────────────────────────────
  // GET /complaints
  // Admin sees all complaints (with filters)
  // ──────────────────────────────────────────
  @Get()
  @Roles('ADMIN')
  async findAll(@Query() query: any) {
    return this.complaintsService.findAll(query);
  }

  // ──────────────────────────────────────────
  // GET /complaints/mine
  // Citizen sees their own complaints
  // ──────────────────────────────────────────
  @Get('mine')
  async findMine(@Request() req) {
    return this.complaintsService.findMine(req.user.userId);
  }

  // ──────────────────────────────────────────
  // GET /complaints/department/:dept
  // Officer sees complaints for their department
  // ──────────────────────────────────────────
  @Get('department/:department')
  @Roles('OFFICER', 'ADMIN')
  async findByDepartment(@Param('department') department: string) {
    return this.complaintsService.findByDepartment(department);
  }

  // ──────────────────────────────────────────
  // GET /complaints/sla-breaches
  // Admin sees all SLA-breached complaints
  // ──────────────────────────────────────────
  @Get('sla-breaches')
  @Roles('ADMIN')
  async getSlaBreaches() {
    return this.complaintsService.getSlaBreaches();
  }

  // ──────────────────────────────────────────
  // GET /complaints/stats
  // Admin dashboard stats
  // ──────────────────────────────────────────
  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    return this.complaintsService.getStats();
  }

  // ──────────────────────────────────────────
  // GET /complaints/:id
  // Anyone can view a single complaint
  // ──────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  // ──────────────────────────────────────────
  // PATCH /complaints/:id/status
  // Officer or Admin updates complaint status
  // ──────────────────────────────────────────
  @Patch(':id/status')
  @Roles('OFFICER', 'ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
    @Headers('x-user-name') actorName: string,
  ) {
    return this.complaintsService.updateStatus(id, dto, req.user, actorName);
  }

  // ──────────────────────────────────────────
  // PATCH /complaints/:id/assign
  // Admin assigns an officer to a complaint
  // ──────────────────────────────────────────
  @Patch(':id/assign')
  @Roles('ADMIN')
  async assignOfficer(
    @Param('id') id: string,
    @Body() dto: AssignOfficerDto,
    @Request() req,
  ) {
    return this.complaintsService.assignOfficer(id, dto, req.user);
  }

  // ──────────────────────────────────────────
  // GET /complaints/health
  // ──────────────────────────────────────────
  @Get('health')
  @UseGuards()
  health() {
    return { status: 'ok', service: 'complaint-service' };
  }
}

