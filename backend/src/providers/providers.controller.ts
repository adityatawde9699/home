import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { ProvidersService } from './providers.service.js';
import { RegisterProviderDto } from './dto/register-provider.dto.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('register')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  async register(@Req() req: any, @Body() registerDto: RegisterProviderDto) {
    return this.providersService.registerProvider(req.user.uid, registerDto);
  }

  @Get('search')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER) // Only customers can search for providers
  async searchNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
    @Query('serviceId') serviceId?: string,
  ) {
    if (!lat || !lng) {
      throw new ForbiddenException('Latitude and Longitude are required for geospatial search');
    }
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.providersService.searchNearby(parseFloat(lat), parseFloat(lng), radiusKm, serviceId);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll() {
    return this.providersService.findAll();
  }

  @Patch(':id/approve')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approve(@Param('id') id: string) {
    return this.providersService.approveProvider(id);
  }

  @Patch(':id/reject')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async reject(@Param('id') id: string) {
    return this.providersService.reject(id);
  }
}
