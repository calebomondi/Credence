import { PassportService } from './passport.service';
export declare class PassportController {
    private readonly passportService;
    constructor(passportService: PassportService);
    preparePassport(body: {
        portfolioValue: number;
        tier: number;
        userEmail: string;
    }): Promise<{
        commitment: string;
        tier: number;
        proof: string;
        publicInputs: string[];
        verificationKey: string;
        nonce: string;
    }>;
    getMyPassport(req: any): Promise<{
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
    confirmPassport(body: {
        commitment: string;
    }, req: any): Promise<{
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
    getPassport(userEmail: string): Promise<{
        commitment: string;
        tier: number;
        createdAt: Date;
    } | null>;
}
