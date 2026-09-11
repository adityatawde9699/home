import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles specified means anyone authenticated can access
    }

    const { user } = context.switchToHttp().getRequest();
    
    // We assume FirebaseAuthGuard ran before this and populated req.user with { uid }
    if (!user || !user.uid) {
      return false;
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.uid } });
    if (!dbUser) {
      return false;
    }

    return requiredRoles.includes(dbUser.role);
  }
}
