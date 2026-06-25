import { Injectable } from '@nestjs/common';
import { Horizon } from '@stellar/stellar-sdk';
import { PriceService } from '../price/price.service';

@Injectable()
export class PortfolioService {
  private horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

  constructor(private readonly priceService: PriceService) {}

  private async lookupBalance(address: string, xlmPrice: number): Promise<number> {
    try {
      const server = new Horizon.Server(this.horizonUrl, { allowHttp: true });
      const account = await server.loadAccount(address);

      const prices = new Map<string, number>();
      let totalUsd = 0;

      for (const balance of account.balances) {
        const amount = parseFloat(balance.balance);
        if (balance.asset_type === 'native') {
          totalUsd += amount * xlmPrice;
        } else if (balance.asset_type !== 'liquidity_pool_shares') {
          const code = (balance as any).asset_code;
          if (!prices.has(code)) {
            prices.set(code, await this.priceService.getAssetPrice(code));
          }
          totalUsd += amount * prices.get(code)!;
        }
      }

      return Math.round(totalUsd * 100) / 100;
    } catch {
      return 0;
    }
  }

  async aggregate(stellarAddresses: string[]): Promise<number> {
    if (stellarAddresses.length === 0) return 0;

    const xlmPrice = await this.priceService.getXlmPrice();
    const results = await Promise.all(
      stellarAddresses.map((addr) => this.lookupBalance(addr, xlmPrice)),
    );

    const total = results.reduce((sum, val) => sum + val, 0);
    return Math.round(total * 100) / 100;
  }
}
