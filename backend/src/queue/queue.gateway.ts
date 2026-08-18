import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma/enums';
import { KioskTokenService } from './kiosk-token.service';
import { QueueService } from './queue.service';
import { SubscribeDto } from './dto';

type AccessJwtPayload = {
  sub: string;
  email: string;
  role: Role;
  doctorProfileId?: string | null;
};

@Injectable()
@WebSocketGateway({
  namespace: '/queue',
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
})
export class QueueGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(QueueGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly kioskTokenService: KioskTokenService,
    private readonly queueService: QueueService,
  ) {}

  afterInit(server: Server) {
    this.queueService.setServer(server);
  }

  async handleConnection(socket: Socket) {
    const token = this.getString(socket.handshake.auth?.token) ?? this.getString(socket.handshake.auth?.kioskToken) ?? this.getString(socket.handshake.query?.kioskToken);
    if (!token) {
      this.reject(socket, 'unauthorized');
      return;
    }

    if (this.getString(socket.handshake.auth?.token)) {
      const access = this.verifyAccessToken(token);
      if (!access || access.role === Role.PATIENT) {
        this.reject(socket, 'unauthorized');
        return;
      }

      socket.data.user = {
        userId: access.sub,
        email: access.email,
        role: access.role,
        doctorProfileId: access.doctorProfileId ?? null,
      };
      this.logger.log(`queue.connect socketId=${socket.id} userId=${access.sub} role=${access.role}`);
      return;
    }

    const kiosk = this.kioskTokenService.verify(token);
    if (!kiosk) {
      this.reject(socket, 'unauthorized');
      return;
    }

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: kiosk.sub }, select: { id: true } });
    if (!doctor) {
      this.reject(socket, 'unauthorized');
      return;
    }

    socket.data.kiosk = { doctorId: doctor.id, isKiosk: true };
    await socket.join(`doctor:${doctor.id}`);
    socket.emit('queue.snapshot', await this.queueService.buildSnapshot(doctor.id));
    this.logger.log(`queue.connect socketId=${socket.id} kioskDoctorId=${doctor.id}`);
  }

  @SubscribeMessage('queue.subscribe')
  async subscribe(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown) {
    const dto = this.validateSubscribeDto(socket, body);
    if (!dto) {
      return;
    }

    const user = socket.data.user as { userId: string; role: Role; doctorProfileId?: string | null } | undefined;
    if (!user || socket.data.kiosk) {
      this.reject(socket, 'unauthorized');
      return;
    }

    if (user.role === Role.DOCTOR && user.doctorProfileId !== dto.doctorId) {
      this.reject(socket, 'unauthorized');
      return;
    }

    await socket.join(`doctor:${dto.doctorId}`);
    socket.emit('queue.snapshot', await this.queueService.buildSnapshot(dto.doctorId));
  }

  @SubscribeMessage('queue.unsubscribe')
  async unsubscribe(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown) {
    const dto = this.validateSubscribeDto(socket, body);
    if (!dto) {
      return;
    }

    const user = socket.data.user as { userId: string; role: Role; doctorProfileId?: string | null } | undefined;
    if (!user || socket.data.kiosk) {
      this.reject(socket, 'unauthorized');
      return;
    }

    if (user.role === Role.DOCTOR && user.doctorProfileId !== dto.doctorId) {
      this.reject(socket, 'unauthorized');
      return;
    }

    await socket.leave(`doctor:${dto.doctorId}`);
  }

  private validateSubscribeDto(socket: Socket, body: unknown) {
    const dto = plainToInstance(SubscribeDto, body ?? {});
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      this.reject(socket, 'invalid_payload');
      return null;
    }

    return dto;
  }

  private verifyAccessToken(token: string): AccessJwtPayload | null {
    try {
      return this.jwtService.verify<AccessJwtPayload>(token, { secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET') });
    } catch {
      return null;
    }
  }

  private reject(socket: Socket, reason: string) {
    socket.emit('exception', { message: reason });
    socket.disconnect(true);
    this.logger.warn(`queue.reject socketId=${socket.id} reason=${reason}`);
  }

  private getString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
