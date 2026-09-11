import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(firebaseUser: any, role: Role) {
    try {
      // Find existing user
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: firebaseUser.phone_number },
            { id: firebaseUser.uid }, // We can use firebase uid as the primary ID
          ]
        },
        include: {
          customer: true,
          provider: true
        }
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            id: firebaseUser.uid,
            phone: firebaseUser.phone_number || '',
            email: firebaseUser.email,
            role: role,
          },
          include: {
            customer: true,
            provider: true
          }
        });

        // Initialize specific profile based on role
        if (role === Role.CUSTOMER) {
          await this.prisma.customer.create({
            data: { userId: user.id }
          });
        }
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to sync user with database');
    }
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
