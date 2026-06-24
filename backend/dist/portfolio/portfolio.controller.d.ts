import { PortfolioService } from './portfolio.service';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
    getPortfolio(body: {
        stellarAddresses: string[];
    }): Promise<{
        totalValueUsd: number;
    }>;
}
