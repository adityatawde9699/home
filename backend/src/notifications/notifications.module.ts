import { Global, Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway.js';
import { AuthModule } from '../auth/auth.module.js';

@Global() // Make it global so BookingsService can easily inject the gateway without circular dependency headaches
@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
