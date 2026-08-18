import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { Role } from '../generated/prisma/enums';
import { JoinWaitlistDto, UpdateWindowDto, WaitlistQueryDto } from './dto';
import { WaitlistService } from './waitlist.service';

@ApiTags('waitlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @Roles(Role.PATIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join a doctor waitlist' })
  @ApiBody({ type: JoinWaitlistDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  join(@Body() dto: JoinWaitlistDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.waitlistService.joinWaitlist(dto, currentUser);
  }

  @Get()
  @Roles(Role.PATIENT, Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: 'List waitlist entries' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  async list(@Query() query: WaitlistQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    const result=await this.waitlistService.getWaitlist(query, currentUser);
    //return null;
    //console.log('whitelist get', query, currentUser);
    //console.log('whitelist get',result);
    return result;
  }

  @Patch(':id')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Update waitlist availability window' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateWindowDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  update(@Param('id') id: string, @Body() dto: UpdateWindowDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.waitlistService.updateWindow(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.PATIENT, Role.RECEPTIONIST, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave or remove a waitlist entry' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async leave(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    await this.waitlistService.leaveWaitlist(id, currentUser);
  }

  @Get('offers/:offerId')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'View a waitlist offer' })
  @ApiParam({ name: 'offerId' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  getOffer(@Param('offerId') offerId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    console.log("offer no:",offerId);
    return this.waitlistService.getOffer(offerId, currentUser);
  }

  @Post('offers/:offerId/accept')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Accept a waitlist offer' })
  @ApiParam({ name: 'offerId' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  accept(@Param('offerId') offerId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.waitlistService.acceptOffer(offerId, currentUser);
  }

  @Post('offers/:offerId/decline')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Decline a waitlist offer' })
  @ApiParam({ name: 'offerId' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  decline(@Param('offerId') offerId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.waitlistService.declineOffer(offerId, currentUser);
  }
}
