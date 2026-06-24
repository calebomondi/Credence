"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VascoreService = void 0;
const common_1 = require("@nestjs/common");
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const LEVELS = [
    [80, 'A'], [65, 'B'], [50, 'C'], [35, 'D'], [20, 'E'], [0, 'F'],
];
function toLevel(n) {
    for (const [min, level] of LEVELS)
        if (n >= min)
            return level;
    return 'F';
}
let VascoreService = class VascoreService {
    horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    async fetchXlmPrice() {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd', { headers: { Accept: 'application/json' } });
            const data = await res.json();
            return data.stellar?.usd ?? 0.10;
        }
        catch {
            return 0.10;
        }
    }
    async computeWalletScore(address) {
        const server = new stellar_sdk_1.Horizon.Server(this.horizonUrl, { allowHttp: true });
        const [accountRes, oldTxRes, recentTxs, paymentsRes] = await Promise.all([
            server.loadAccount(address).catch(() => null),
            server.transactions().forAccount(address).order('asc').limit(1).call().catch(() => null),
            server.transactions().forAccount(address).order('desc').limit(200).call().catch(() => null),
            server.payments().forAccount(address).order('desc').limit(200).call().catch(() => null),
        ]);
        const xlmPrice = await this.fetchXlmPrice();
        let portfolioValue = 0;
        if (accountRes) {
            for (const b of accountRes.balances) {
                const amt = parseFloat(b.balance);
                if (b.asset_type === 'native')
                    portfolioValue += amt * xlmPrice;
                else if (b.asset_type !== 'liquidity_pool_shares' && b.asset_code === 'USDC')
                    portfolioValue += amt;
            }
        }
        portfolioValue = Math.round(portfolioValue * 100) / 100;
        const trustlineCount = accountRes
            ? accountRes.balances.filter((b) => b.asset_type !== 'liquidity_pool_shares' && b.asset_type !== 'native').length
            : 0;
        let accountAgeMonths = 0;
        if (oldTxRes && oldTxRes.records.length > 0) {
            const firstTx = oldTxRes.records[0];
            const created = new Date(firstTx.created_at);
            accountAgeMonths = Math.max(1, Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        }
        else if (accountRes) {
            accountAgeMonths = 1;
        }
        else {
            accountAgeMonths = 1;
        }
        const txs = (recentTxs?.records ?? []).map((r) => ({
            successful: r.successful,
            createdAt: r.created_at,
        }));
        const totalTxs = txs.length;
        const failedTxs = txs.filter((t) => !t.successful).length;
        const txFrequencyPerMonth = totalTxs / accountAgeMonths;
        const failedTxRatio = totalTxs > 0 ? failedTxs / totalTxs : 0;
        const payments = (paymentsRes?.records ?? []).map((r) => ({
            amount: r.amount || '0',
            from: r.from,
            to: r.to,
            asset_type: r.asset_type,
            asset_code: r.asset_code,
        }));
        let avgPaymentVolumeUsd = 0;
        let incomingUsd = 0;
        let outgoingUsd = 0;
        if (payments.length > 0) {
            let totalUsd = 0;
            for (const p of payments) {
                const amt = parseFloat(p.amount) || 0;
                const inUsd = p.asset_type === 'native' ? amt * xlmPrice : p.asset_code === 'USDC' ? amt : amt * 0.5;
                totalUsd += inUsd;
                if (p.to === address)
                    incomingUsd += inUsd;
                else if (p.from === address)
                    outgoingUsd += inUsd;
            }
            avgPaymentVolumeUsd = totalUsd / payments.length;
        }
        const ioRatio = outgoingUsd > 0 ? incomingUsd / outgoingUsd : incomingUsd > 0 ? 2 : 1;
        const monthsActive = new Set(txs.map((t) => {
            const d = new Date(t.createdAt);
            return `${d.getFullYear()}-${d.getMonth()}`;
        })).size;
        const consistencyPct = Math.min((monthsActive / Math.max(accountAgeMonths, 1)) * 100, 100);
        const normPortfolio = Math.min((portfolioValue / 25000) * 100, 100);
        const normAge = Math.min((accountAgeMonths / 36) * 100, 100);
        const normFrequency = Math.min((txFrequencyPerMonth / 30) * 100, 100);
        const normFailed = Math.max(100 - failedTxRatio * 500, 0);
        const normAvgVolume = Math.min((avgPaymentVolumeUsd / 500) * 100, 100);
        const normIoRatio = Math.max(100 - Math.abs(ioRatio - 1) * 50, 0);
        const normTrustlines = Math.min((trustlineCount / 10) * 100, 100);
        const normConsistency = consistencyPct;
        const scoreNumeric = Math.round(normPortfolio * 0.30 +
            normAge * 0.15 +
            normFrequency * 0.15 +
            normFailed * 0.10 +
            normAvgVolume * 0.10 +
            normIoRatio * 0.05 +
            normTrustlines * 0.05 +
            normConsistency * 0.10);
        const scoreLevel = toLevel(scoreNumeric);
        return {
            address,
            portfolioValue,
            accountAgeMonths,
            txFrequencyPerMonth: Math.round(txFrequencyPerMonth * 100) / 100,
            failedTxRatio: Math.round(failedTxRatio * 100) / 100,
            avgPaymentVolumeUsd: Math.round(avgPaymentVolumeUsd * 100) / 100,
            ioRatio: Math.round(ioRatio * 100) / 100,
            trustlineCount,
            consistencyPct: Math.round(consistencyPct * 100) / 100,
            scoreNumeric,
            scoreLevel,
        };
    }
    async computeMultiWallet(addresses) {
        const wallets = await Promise.all(addresses.map((addr) => this.computeWalletScore(addr)));
        if (wallets.length === 0) {
            return {
                wallets: [],
                combined: { scoreNumeric: 0, scoreLevel: 'F', portfolioValue: 0, accountAgeMonths: 0, txFrequencyPerMonth: 0, trustlineCount: 0 },
            };
        }
        const maxAge = Math.max(...wallets.map((w) => w.accountAgeMonths));
        const totalPortfolio = wallets.reduce((s, w) => s + w.portfolioValue, 0);
        const totalTxs = wallets.reduce((s, w) => s + w.txFrequencyPerMonth * w.accountAgeMonths, 0);
        const totalFailed = wallets.reduce((s, w) => s + w.failedTxRatio * w.txFrequencyPerMonth * w.accountAgeMonths, 0);
        const avgTxFreq = totalTxs / maxAge;
        const avgFailedRatio = totalTxs > 0 ? totalFailed / totalTxs : 0;
        const unionTrustlines = new Set();
        const totalTrustlines = wallets.reduce((s, w) => s + w.trustlineCount, 0);
        const avgVolume = wallets.reduce((s, w) => s + w.avgPaymentVolumeUsd, 0) / wallets.length;
        const totalIncoming = wallets.reduce((s, w) => s + w.ioRatio, 0);
        const totalOutgoing = 1;
        const combinedIoRatio = totalIncoming / wallets.length;
        const avgConsistency = wallets.reduce((s, w) => s + w.consistencyPct * w.accountAgeMonths, 0) / wallets.reduce((s, w) => s + w.accountAgeMonths, 0);
        const normPortfolio = Math.min((totalPortfolio / 25000) * 100, 100);
        const normAge = Math.min((maxAge / 36) * 100, 100);
        const normFrequency = Math.min((avgTxFreq / 30) * 100, 100);
        const normFailed = Math.max(100 - avgFailedRatio * 500, 0);
        const normAvgVolume = Math.min((avgVolume / 500) * 100, 100);
        const normIoRatio = Math.max(100 - Math.abs(combinedIoRatio - 1) * 50, 0);
        const normTrustlines = Math.min((totalTrustlines / 10) * 100, 100);
        const normConsistency = avgConsistency;
        const combinedNumeric = Math.round(normPortfolio * 0.30 +
            normAge * 0.15 +
            normFrequency * 0.15 +
            normFailed * 0.10 +
            normAvgVolume * 0.10 +
            normIoRatio * 0.05 +
            normTrustlines * 0.05 +
            normConsistency * 0.10);
        return {
            wallets,
            combined: {
                scoreNumeric: combinedNumeric,
                scoreLevel: toLevel(combinedNumeric),
                portfolioValue: totalPortfolio,
                accountAgeMonths: maxAge,
                txFrequencyPerMonth: Math.round(avgTxFreq * 100) / 100,
                trustlineCount: totalTrustlines,
            },
        };
    }
};
exports.VascoreService = VascoreService;
exports.VascoreService = VascoreService = __decorate([
    (0, common_1.Injectable)()
], VascoreService);
//# sourceMappingURL=vascore.service.js.map