import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(private readonly prisma: PrismaService) {
    // In production, load from config/env
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
    });
  }

  async createPaymentOrder(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { customer: true }
    });
    
    if (!booking) throw new BadRequestException('Booking not found');
    
    // Ensure only the customer who made the booking can pay
    if (booking.customer.userId !== userId) throw new BadRequestException('Unauthorized: You do not own this booking');
    if (booking.status !== BookingStatus.REQUESTED && booking.status !== BookingStatus.ACCEPTED) {
      throw new BadRequestException('Booking is not in a payable state');
    }

    try {
      // 1. Create Order in Razorpay
      const order = await this.razorpay.orders.create({
        amount: booking.totalAmountPaise,
        currency: 'INR',
        receipt: `receipt_${booking.id}`,
      });

      // 2. Create Payment Record in Database
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          gatewayRef: order.id,
          amountPaise: booking.totalAmountPaise,
          status: PaymentStatus.PAYMENT_CREATED,
        }
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment.id
      };
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error);
      throw new InternalServerErrorException('Payment gateway error');
    }
  }

  async processWebhook(payload: any, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    
    // 1. Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    const event = payload.event;
    
    // 2. Handle Payment Captured
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      // We use a transaction for Idempotency and consistency
      await this.prisma.$transaction(async (tx) => {
        // Find payment by gatewayRef (orderId)
        const payment = await tx.payment.findUnique({
          where: { gatewayRef: orderId },
          include: { booking: true }
        });

        if (!payment) {
          this.logger.warn(`Webhook received for unknown order: ${orderId}`);
          return;
        }

        // Idempotency check: Ignore if already processed
        if (payment.status === PaymentStatus.PAYMENT_CAPTURED) {
          this.logger.log(`Payment ${orderId} already processed. Ignoring webhook.`);
          return;
        }

        // 3. Update Payment Status
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PAYMENT_CAPTURED },
        });

        // 4. Update Booking Status (if appropriate)
        if (payment.booking.status === BookingStatus.REQUESTED) {
           await tx.booking.update({
             where: { id: payment.booking.id },
             data: { status: BookingStatus.ACCEPTED }
           });
        }
      });
      return { status: 'ok' };
    }

    return { status: 'ignored' };
  }
}
