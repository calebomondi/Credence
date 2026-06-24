import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private challenges;
    constructor(prisma: PrismaService);
    createChallenge(address: string): Promise<{
        challenge: string;
        challengeId: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    checkWallet(walletAddress: string): Promise<{
        status: string;
        walletAddress?: undefined;
        verifiedAt?: undefined;
    } | {
        status: string;
        walletAddress: string;
        verifiedAt: Date;
    }>;
    verifyWallet(walletAddress: string, signature: string, challengeId: string, userId: string, email: string): Promise<{
        verified: boolean;
        walletAddress: string;
        verifiedAt: Date;
    }>;
    listWallets(userId: string): Promise<{
        id: string;
        createdAt: Date;
        verifiedAt: Date;
        userId: string;
        email: string;
        walletAddress: string;
        signature: string | null;
        status: string;
    }[]>;
}
