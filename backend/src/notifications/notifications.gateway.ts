import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { FirebaseService } from '../auth/firebase.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  
  // Map to store connected users: userId -> Socket instance
  private connectedUsers = new Map<string, Socket>();

  constructor(private readonly firebaseService: FirebaseService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected attempting: ${client.id}`);
    
    try {
      // Expect token in handshake query or headers
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const decodedToken = await this.firebaseService.getAuth().verifyIdToken(token);
      const userId = decodedToken.uid;
      
      // Store user connection
      this.connectedUsers.set(userId, client);
      
      // Join a room specific to this user so we can emit directly to them
      client.join(`user_${userId}`);
      this.logger.log(`Client authenticated and joined room user_${userId}`);
      
    } catch (error) {
      this.logger.error('WebSocket Authentication failed', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up connectedUsers map (O(n) but fine for MVP. Usually handled via rooms or Redis in scale)
    for (const [userId, socket] of this.connectedUsers.entries()) {
      if (socket.id === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  /**
   * Utility to send a real-time booking update to a specific user (Customer or Provider)
   */
  notifyBookingStatusChange(userId: string, bookingId: string, status: string) {
    this.server.to(`user_${userId}`).emit('bookingStatusUpdated', {
      bookingId,
      status,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted bookingStatusUpdated to user_${userId} for booking ${bookingId}`);
  }
}
