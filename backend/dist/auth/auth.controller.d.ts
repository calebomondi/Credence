import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getChallenge(body: {
        address: string;
    }): Promise<{
        challenge: string;
        challengeId: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    checkWallet(body: {
        walletAddress: string;
    }): Promise<{
        status: string;
        walletAddress?: undefined;
        verifiedAt?: undefined;
    } | {
        status: string;
        walletAddress: string;
        verifiedAt: Date;
    }>;
    verifyWallet(body: {
        walletAddress: string;
        signature: string;
        challengeId: string;
    }, req: any): Promise<{
        verified: boolean;
        walletAddress: string;
        verifiedAt: Date;
    }>;
    listWallets(req: any): Promise<{
        id: string;
        createdAt: Date;
        verifiedAt: Date;
        userId: string;
        email: string;
        walletAddress: string;
        signature: string | null;
        status: string;
    }[]>;
    getMe(req: any): Promise<any>;
}
