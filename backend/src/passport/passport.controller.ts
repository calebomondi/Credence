import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PassportService } from './passport.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('api/passport')
export class PassportController {
  constructor(private readonly passportService: PassportService) {}

  @Post('prepare')
  async preparePassport(@Body() body: { portfolioValue: number; tier: number; userEmail: string }) {
    return this.passportService.prepareProof(body.portfolioValue, body.tier, body.userEmail);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('my')
  async getMyPassport(@Request() req: any) {
    const email = req.user?.email;
    if (!email) return null;
    return this.passportService.getMyPassport(email);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('confirm')
  async confirmPassport(@Body() body: { commitment: string }, @Request() req: any) {
    const email = req.user?.email;
    if (!email) return null;
    return this.passportService.confirmPassport(body.commitment, email);
  }

  @Get('search')
  async searchPassport(@Query('q') query: string) {
    // console.log(`>> ${query}`)
    if (!query) return null;
    return this.passportService.searchPassport(query);
  }

  @Get('verify/:commitmentHash')
  async verifyPassport(@Param('commitmentHash') commitmentHash: string) {
    return this.passportService.verifyPassport(commitmentHash);
  }

  @Get(':userEmail')
  async getPassport(@Param('userEmail') userEmail: string) {
    return this.passportService.getPassport(userEmail);
  }
}
