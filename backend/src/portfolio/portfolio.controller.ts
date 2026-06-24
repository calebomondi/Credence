import { Controller, Post, Body } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('api/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  async getPortfolio(@Body() body: { stellarAddresses: string[] }) {
    const totalValueUsd = await this.portfolioService.aggregate(body.stellarAddresses);
    return { totalValueUsd };
  }
}
