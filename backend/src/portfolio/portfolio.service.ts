import { Injectable } from '@nestjs/common';
import { Horizon } from '@stellar/stellar-sdk';

let cachedXlmPrice: number | null = null;
let lastFetched = 0;
const CACHE_TTL = 60_000;

@Injectable()
export class PortfolioService {
  private horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

  private async fetchXlmPrice(): Promise<number> {
    const now = Date.now();
    if (cachedXlmPrice !== null && now - lastFetched < CACHE_TTL) {
      return cachedXlmPrice;
    }
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
        { headers: { Accept: 'application/json' } },
      );
      const data = await res.json();
      cachedXlmPrice = data.stellar?.usd ?? 0.10;
      lastFetched = now;
    } catch {
      cachedXlmPrice = 0.10;
    }
    return cachedXlmPrice!;
  }

  private async lookupBalance(address: string, xlmPrice: number): Promise<number> {
    try {
      const server = new Horizon.Server(this.horizonUrl, { allowHttp: true });
      const account = await server.loadAccount(address);

      let totalUsd = 0;
      for (const balance of account.balances) {
        const amount = parseFloat(balance.balance);
        if (balance.asset_type === 'native') {
          totalUsd += amount * xlmPrice;
        } else if (balance.asset_type !== 'liquidity_pool_shares' && 'asset_code' in balance && balance.asset_code === 'USDC') {
          totalUsd += amount;
        }
      }
      return Math.round(totalUsd * 100) / 100;
    } catch {
      return 0;
    }
  }

  async aggregate(stellarAddresses: string[]): Promise<number> {
    if (stellarAddresses.length === 0) return 0;

    const xlmPrice = await this.fetchXlmPrice();
    const results = await Promise.all(
      stellarAddresses.map((addr) => this.lookupBalance(addr, xlmPrice)),
    );

    const total = results.reduce((sum, val) => sum + val, 0);
    return Math.round(total * 100) / 100;
  }
}
