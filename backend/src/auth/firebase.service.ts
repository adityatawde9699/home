import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    try {
      if (!getApps().length) {
        // In a real production app, you would load the service account from an env var or secrets manager
        // e.g. credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        // For local MVP, we initialize with default credentials or skip if no credentials provided yet.
        initializeApp();
        this.logger.log('Firebase Admin initialized successfully');
      }
    } catch (error: any) {
      this.logger.warn('Firebase Admin initialization failed. Ensure FIREBASE_SERVICE_ACCOUNT is set.', error.message);
    }
  }

  getAuth() {
    return getAuth();
  }
}
