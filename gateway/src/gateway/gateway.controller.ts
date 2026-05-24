import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GatewayController {
  private readonly complaintUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {
    this.complaintUrl = config.get<string>('COMPLAINT_SERVICE_URL') || 'http://complaint-service:3002';
  }

  private forwardHeaders(req: any) {
    return {
      Authorization: req.headers.authorization,
      'x-user-id': req.user.userId,
      'x-user-email': req.user.email,
      'x-user-role': req.user.role,
      'x-user-name': req.user.name || req.user.email,
      'Content-Type': 'application/json',
    };
  }

  @Post()
  async create(@Body() body: any, @Request() req) {
    const res = await firstValueFrom(
      this.http.post(`${this.complaintUrl}/complaints`, body, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Get('mine')
  async getMine(@Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.complaintUrl}/complaints/mine`, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Get('stats')
  @Roles('ADMIN')
  async getStats(@Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.complaintUrl}/complaints/stats`, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Get('sla-breaches')
  @Roles('ADMIN')
  async getSlaBreaches(@Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.complaintUrl}/complaints/sla-breaches`, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Get('department/:department')
  @Roles('OFFICER', 'ADMIN')
  async getByDepartment(@Param('department') dept: string, @Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.complaintUrl}/complaints/department/${dept}`, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Get()
  @Roles('ADMIN')
  async getAll(@Query() query: any, @Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.complaintUrl}/complaints`, {
        params: query,
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.complaintUrl}/complaints/${id}`, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Patch(':id/status')
  @Roles('OFFICER', 'ADMIN')
  async updateStatus(@Param('id') id: string, @Body() body: any, @Request() req) {
    const res = await firstValueFrom(
      this.http.patch(`${this.complaintUrl}/complaints/${id}/status`, body, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }

  @Patch(':id/assign')
  @Roles('ADMIN')
  async assignOfficer(@Param('id') id: string, @Body() body: any, @Request() req) {
    const res = await firstValueFrom(
      this.http.patch(`${this.complaintUrl}/complaints/${id}/assign`, body, {
        headers: this.forwardHeaders(req),
      }),
    );
    return res.data;
  }
}
