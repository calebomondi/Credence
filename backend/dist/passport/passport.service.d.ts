import { PrismaService } from '../prisma/prisma.service';
import { ProvingService } from '../proving/proving.service';
import { VascoreService } from '../vascore/vascore.service';
export declare class PassportService {
    private prisma;
    private proving;
    private vascore;
    constructor(prisma: PrismaService, proving: ProvingService, vascore: VascoreService);
    prepareProof(portfolioValue: number, tier: number, userEmail: string): Promise<{
        commitment: string;
        tier: number;
        proof: string;
        publicInputs: string[];
        verificationKey: string;
        nonce: string;
    }>;
    getPassport(userEmail: string): Promise<{
        commitment: string;
        tier: number;
        createdAt: Date;
    } | null>;
    verifyPassport(commitmentHash: string): Promise<{
        commitment: string;
        tier: number;
        proofHash: string;
        createdAt: Date;
        holderEmail: string;
        combinedScore: number | null;
        scoreLevel: string | null;
        walletCount: number | null;
        verifiedAt: Date | null;
    } | null>;
    searchPassport(query: string): Promise<{
        commitment: string;
        tier: number;
        proofHash: string;
        createdAt: Date;
        holderEmail: string;
        combinedScore: number | null;
        scoreLevel: string | null;
        walletCount: number | null;
        verifiedAt: Date | null;
    } | null>;
    confirmPassport(commitment: string, userEmail: string): Promise<{
        commitment: string;
        id: string;
        scoreLevel: string;
        tier: number;
        proofHash: string;
        createdAt: Date;
        userEmail: string;
        verifiedAt: Date;
        combinedScore: number;
        walletCount: number;
    } | null>;
    getMyPassport(userEmail: string): Promise<{
        commitment: string;
        tier: number;
        verifiedAt: number;
        proofHash: string;
        walletCount: number;
        combinedScore: {
            scoreNumeric: number;
            scoreLevel: string;
        };
        userEmail: string;
    } | null>;
    private getOnChainPassport;
    private getThresholdForTier;
    private sha256;
}
