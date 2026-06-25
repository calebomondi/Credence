import { Injectable, Logger } from '@nestjs/common';

const STABLECOINS = new Set(['USDC', 'EURC', 'USDA', 'USDT']);

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private cachedXlmPrice: number | null = null;
  private lastFetched = 0;
  private readonly CACHE_TTL = 300_000;
  private assetCache = new Map<string, { price: number; expiresAt: number }>();

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

  async getAssetPrice(assetCode: string): Promise<number> {
    const code = assetCode.toUpperCase();
    if (STABLECOINS.has(code)) return 1.0;

    const cached = this.assetCache.get(code);
    if (cached && Date.now() < cached.expiresAt) return cached.price;

    try {
      const res = await fetch(
        `https://api.stellar.expert/explorer/public/asset?search=${code}&limit=1`,
        { headers: { Accept: 'application/json' } },
      );
      if (res.ok) {
        const data = await res.json() as { _embedded?: { records?: Array<{ price: number }> } };
        const price = data._embedded?.records?.[0]?.price;
        if (price && price > 0) {
          this.assetCache.set(code, { price, expiresAt: Date.now() + this.CACHE_TTL });
          return price;
        }
      } else if (res.status === 429) {
        this.logger.warn(`StellarExpert rate limited for ${code}`);
      } else {
        this.logger.warn(`StellarExpert returned ${res.status} for ${code}`);
      }
    } catch (err) {
      this.logger.error(`Failed to fetch price for ${code}: ${err}`);
    }

    this.assetCache.set(code, { price: 0.10, expiresAt: Date.now() + this.CACHE_TTL });
    return 0.10;
  }

  private fallback(): number {
    if (this.cachedXlmPrice !== null) {
      return this.cachedXlmPrice;
    }
    return 0.10;
  }
}
