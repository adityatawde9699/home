import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  status: BookingStatus;
}
