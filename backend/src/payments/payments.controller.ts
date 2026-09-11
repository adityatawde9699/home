import { Controller, Post, Body, Param, UseGuards, Req, Headers, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':bookingId/create-order')
  @UseGuards(FirebaseAuthGuard)
  createOrder(@Req() req: any, @Param('bookingId') bookingId: string) {
    // req.user.uid is the customer's userId
    // Wait, the booking model uses customerId. We need to fetch the customer profile ID inside the service.
    // We'll pass the userId for now and resolve customer inside service.
    return this.paymentsService.createPaymentOrder(bookingId, req.user.uid);
  }

  @Post('webhook')
  @HttpCode(200) // Razorpay expects a 200 OK
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any
  ) {
    return this.paymentsService.processWebhook(payload, signature);
  }
}
