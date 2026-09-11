import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { FirebaseService } from './firebase.service.js';
import { FirebaseAuthStrategy } from './firebase-auth.strategy.js';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'firebase-auth' })],
  providers: [AuthService, FirebaseService, FirebaseAuthStrategy],
  exports: [AuthService, FirebaseService, PassportModule],
})
export class AuthModule {}
