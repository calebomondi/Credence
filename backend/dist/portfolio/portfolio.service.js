"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const stellar_sdk_1 = require("@stellar/stellar-sdk");
let cachedXlmPrice = null;
let lastFetched = 0;
const CACHE_TTL = 60_000;
let PortfolioService = class PortfolioService {
    horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    async fetchXlmPrice() {
        const now = Date.now();
        if (cachedXlmPrice !== null && now - lastFetched < CACHE_TTL) {
            return cachedXlmPrice;
        }
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd', { headers: { Accept: 'application/json' } });
            const data = await res.json();
            cachedXlmPrice = data.stellar?.usd ?? 0.10;
            lastFetched = now;
        }
        catch {
            cachedXlmPrice = 0.10;
        }
        return cachedXlmPrice;
    }
    async lookupBalance(address, xlmPrice) {
        try {
            const server = new stellar_sdk_1.Horizon.Server(this.horizonUrl, { allowHttp: true });
            const account = await server.loadAccount(address);
            let totalUsd = 0;
            for (const balance of account.balances) {
                const amount = parseFloat(balance.balance);
                if (balance.asset_type === 'native') {
                    totalUsd += amount * xlmPrice;
                }
                else if (balance.asset_type !== 'liquidity_pool_shares' && 'asset_code' in balance && balance.asset_code === 'USDC') {
                    totalUsd += amount;
                }
            }
            return Math.round(totalUsd * 100) / 100;
        }
        catch {
            return 0;
        }
    }
    async aggregate(stellarAddresses) {
        if (stellarAddresses.length === 0)
            return 0;
        const xlmPrice = await this.fetchXlmPrice();
        const results = await Promise.all(stellarAddresses.map((addr) => this.lookupBalance(addr, xlmPrice)));
        const total = results.reduce((sum, val) => sum + val, 0);
        return Math.round(total * 100) / 100;
    }
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)()
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map