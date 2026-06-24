import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  async getChallenge(@Body() body: { address: string }) {
    return this.authService.createChallenge(body.address);
  }

  @Post('wallets/check')
  @UseGuards(SupabaseAuthGuard)
  async checkWallet(@Body() body: { walletAddress: string }) {
    return this.authService.checkWallet(body.walletAddress);
  }

  @Post('wallets/verify')
  @UseGuards(SupabaseAuthGuard)
  async verifyWallet(
    @Body() body: { walletAddress: string; signature: string; challengeId: string },
    @Req() req: any,
  ) {
    return this.authService.verifyWallet(
      body.walletAddress,
      body.signature,
      body.challengeId,
      req.user.id,
      req.user.email,
    );
  }

  @Get('wallets')
  @UseGuards(SupabaseAuthGuard)
  async listWallets(@Req() req: any) {
    return this.authService.listWallets(req.user.id);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Req() req: any) {
    return req.user;
  }
}
