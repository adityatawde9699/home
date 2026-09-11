import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  providerId: string;
  serviceId: string;
  scheduledAt: string; // ISO DateTime string
}
