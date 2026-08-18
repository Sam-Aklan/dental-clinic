import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, UserFilterQueryDto, UserResponseDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a user account' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 409 })
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.create(dto, currentUser);
  }

  @Get()
  @Roles('ADMIN','RECEPTIONIST')
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'role', required: false, isArray: true, enum: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'disabled', 'all'] })
  @ApiQuery({ name: 'preferredLocale', required: false, enum: ['EN', 'AR'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['firstName', 'lastName', 'email', 'role', 'createdAt'] })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  findAll(@Query() query: UserFilterQueryDto, @CurrentUser() _currentUser: AuthenticatedUser) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403 })
  findMe(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findOne(currentUser.userId, currentUser);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  updateMe(@Body() dto: UpdateUserDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.update(currentUser.userId, dto, currentUser);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  changePasswordMe(@Body() dto: ChangePasswordDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.changePassword(currentUser.userId, dto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  findOneById(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  updateOneById(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Post(':id/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a user password by id' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  changePasswordById(@Param('id') id: string, @Body() dto: ChangePasswordDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.changePassword(id, dto, currentUser);
  }

  @Patch(':id/disable')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Disable a user account' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  disable(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.disable(id, currentUser);
  }

  @Patch(':id/enable')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Enable a user account' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  enable(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.enable(id, currentUser);
  }
}
