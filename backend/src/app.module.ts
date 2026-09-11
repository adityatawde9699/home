import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ServicesModule } from './services/services.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    CategoriesModule, 
    ServicesModule, 
    ProvidersModule, 
    BookingsModule, 
    PaymentsModule,
    NotificationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
