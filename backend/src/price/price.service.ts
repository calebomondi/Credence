import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private cachedXlmPrice: number | null = null;
  private lastFetched = 0;
  private readonly CACHE_TTL = 300_000;

  async getXlmPrice(): Promise<number> {
    const now = Date.now();
    if (this.cachedXlmPrice !== null && now - this.lastFetched < this.CACHE_TTL) {
      return this.cachedXlmPrice;
    }
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) {
        this.logger.error(`CoinGecko returned ${res.status}`);
        return this.fallback();
      }
      const data = await res.json() as Record<string, Record<string, number>>;
      this.cachedXlmPrice = data.stellar?.usd ?? 0.10;
      this.lastFetched = now;
      return this.cachedXlmPrice;
    } catch (err) {
      this.logger.error(`Failed to fetch XLM price: ${err}`);
      return this.fallback();
    }
  }

  private fallback(): number {
    if (this.cachedXlmPrice !== null) {
      return this.cachedXlmPrice;
    }
    return 0.10;
  }
}
