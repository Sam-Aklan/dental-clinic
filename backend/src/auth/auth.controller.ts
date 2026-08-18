import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const REFRESH_COOKIE_PATH = '/api/auth';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new patient account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account disabled' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('refreshToken', result.rawRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: result.refreshTokenMaxAge,
      secure: process.env.NODE_ENV === 'production',
    });
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(/* JwtRefreshGuard — temporary: validate manually via authService */)
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return this.authService.throwUnauthorizedRefresh();
    }

    const result = await this.authService.refreshTokensFromCookie(rawToken);
    if (!result) {
      return this.authService.throwUnauthorizedRefresh();
    }

    res.cookie('refreshToken', result.rawRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: result.refreshTokenMaxAge,
      secure: process.env.NODE_ENV === 'production',
    });

    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout and clear refresh cookie' })
  @ApiBearerAuth()
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      await this.authService.logout(user.userId, rawToken);
    }
    res.clearCookie('refreshToken', { path: REFRESH_COOKIE_PATH });
    return { message: 'Logged out.' };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Authenticated user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (no enumeration)' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid/expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
