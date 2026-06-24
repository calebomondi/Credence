import { Controller, Post, Body } from '@nestjs/common';
import { VascoreService } from './vascore.service';
import type { VAScoreResponse } from './vascore.types';

@Controller('api/vascore')
export class VascoreController {
  constructor(private readonly vascoreService: VascoreService) {}

  @Post()
  async getScores(@Body() body: { stellarAddresses: string[] }): Promise<VAScoreResponse> {
    return this.vascoreService.computeMultiWallet(body.stellarAddresses);
  }
}
