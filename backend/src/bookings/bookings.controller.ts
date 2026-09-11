import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('bookings')
@UseGuards(FirebaseAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() createBookingDto: CreateBookingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.uid }, include: { customer: true } });
    if (!user || user.role !== Role.CUSTOMER || !user.customer) {
      throw new ForbiddenException('Only customers can create bookings');
    }
    
    return this.bookingsService.create(user.customer.id, createBookingDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any, 
    @Param('id') id: string, 
    @Body() updateBookingStatusDto: UpdateBookingStatusDto
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.uid } });
    if (!user) throw new BadRequestException('User not found');
    
    return this.bookingsService.updateStatus(id, req.user.uid, user.role, updateBookingStatusDto);
  }

  @Get('customer')
  async getCustomerBookings(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.uid }, include: { customer: true } });
    if (!user || !user.customer) throw new ForbiddenException('Not a customer');
    
    return this.bookingsService.findByCustomer(user.customer.id);
  }

  @Get('provider')
  async getProviderBookings(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.uid }, include: { provider: true } });
    if (!user || !user.provider) throw new ForbiddenException('Not a provider');
    
    return this.bookingsService.findByProvider(user.provider.id);
  }
}
