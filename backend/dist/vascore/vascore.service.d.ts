import type { WalletScoreData, CombinedScore } from './vascore.types';
export declare class VascoreService {
    private horizonUrl;
    private fetchXlmPrice;
    computeWalletScore(address: string): Promise<WalletScoreData>;
    computeMultiWallet(addresses: string[]): Promise<{
        wallets: WalletScoreData[];
        combined: CombinedScore;
    }>;
}
