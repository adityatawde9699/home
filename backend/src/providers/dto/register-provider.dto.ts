import { ProviderStatus } from '@prisma/client';

export class RegisterProviderDto {
  services: string[]; // Array of service IDs the provider offers
  
  // KYC details
  idProofType: string;
  idProofNumber: string;
  idProofUrl?: string; // Link to uploaded document

  // Location
  latitude?: number;
  longitude?: number;
}
