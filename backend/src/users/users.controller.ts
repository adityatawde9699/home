import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  async syncUser(@Req() req: any, @Body('role') role: Role = Role.CUSTOMER) {
    // req.user contains the decoded Firebase token populated by FirebaseAuthStrategy
    return this.usersService.syncUser(req.user, role);
  }
}
