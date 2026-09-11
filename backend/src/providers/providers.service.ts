import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterProviderDto } from './dto/register-provider.dto.js';
import { ProviderStatus } from '@prisma/client';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async registerProvider(userId: string, registerDto: RegisterProviderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if provider profile already exists
    let provider = await this.prisma.provider.findUnique({ where: { userId } });
    
    if (provider) {
      throw new BadRequestException('Provider profile already exists');
    }

    // Create provider profile
    provider = await this.prisma.provider.create({
      data: {
        userId,
        status: ProviderStatus.PENDING,
        idProofType: registerDto.idProofType,
        idProofNumber: registerDto.idProofNumber,
        idProofUrl: registerDto.idProofUrl,
        latitude: registerDto.latitude,
        longitude: registerDto.longitude,
        services: {
          create: registerDto.services.map(serviceId => ({
            service: { connect: { id: serviceId } }
          }))
        }
      },
      include: {
        services: true
      }
    });

    return provider;
  }

  async findAll() {
    return this.prisma.provider.findMany({
      include: { user: true, services: { include: { service: true } } }
    });
  }

  async approveProvider(id: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.APPROVED }
    });
  }

  async reject(id: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.REJECTED }
    });
  }

  /**
   * Search for approved providers within a specific radius using the Haversine formula
   */
  async searchNearby(lat: number, lng: number, radiusKm: number = 10, serviceId?: string) {
    // The Haversine formula in raw SQL
    // 6371 is the radius of the Earth in kilometers
    
    let providers;

    if (serviceId) {
      // If a specific service is requested, we join with ProviderService
      providers = await this.prisma.$queryRaw`
        SELECT * FROM (
          SELECT p.*,
            ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( p.latitude ) )
            * cos( radians( p.longitude ) - radians(${lng}) ) + sin( radians(${lat}) )
            * sin( radians( p.latitude ) ) ) ) AS distance
          FROM "Provider" p
          JOIN "ProviderService" ps ON p.id = ps."providerId"
          WHERE p.status = 'APPROVED'
            AND ps."serviceId" = ${serviceId}
            AND p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
        ) AS distances
        WHERE distance < ${radiusKm}
        ORDER BY distance ASC
        LIMIT 50;
      `;
    } else {
      // General search for any approved provider
      providers = await this.prisma.$queryRaw`
        SELECT * FROM (
          SELECT p.*,
            ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( p.latitude ) )
            * cos( radians( p.longitude ) - radians(${lng}) ) + sin( radians(${lat}) )
            * sin( radians( p.latitude ) ) ) ) AS distance
          FROM "Provider" p
          WHERE p.status = 'APPROVED'
            AND p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
        ) AS distances
        WHERE distance < ${radiusKm}
        ORDER BY distance ASC
        LIMIT 50;
      `;
    }

    return providers;
  }
}
