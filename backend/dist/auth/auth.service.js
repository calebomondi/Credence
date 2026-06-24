"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const crypto = __importStar(require("crypto"));
let AuthService = class AuthService {
    prisma;
    challenges = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createChallenge(address) {
        const challengeId = crypto.randomUUID();
        const message = `Crypto Credit Passport\nVerify wallet ownership\nWallet: ${address}\nNonce: ${challengeId}`;
        this.challenges.set(challengeId, {
            message,
            address,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        if (this.challenges.size > 100) {
            const now = new Date();
            for (const [key, val] of this.challenges) {
                if (val.expiresAt < now)
                    this.challenges.delete(key);
            }
        }
        return { challenge: message, challengeId };
    }
    async checkWallet(walletAddress) {
        const existing = await this.prisma.walletLink.findUnique({
            where: { walletAddress },
        });
        if (!existing) {
            return { status: 'available' };
        }
        return { status: 'linked', walletAddress: existing.walletAddress, verifiedAt: existing.verifiedAt };
    }
    async verifyWallet(walletAddress, signature, challengeId, userId, email) {
        const challenge = this.challenges.get(challengeId);
        if (!challenge) {
            throw new common_1.BadRequestException('Challenge not found or expired');
        }
        if (challenge.address !== walletAddress) {
            throw new common_1.BadRequestException('Challenge does not match wallet');
        }
        if (challenge.expiresAt < new Date()) {
            this.challenges.delete(challengeId);
            throw new common_1.BadRequestException('Challenge expired');
        }
        let isValid = false;
        try {
            const keypair = stellar_sdk_1.Keypair.fromPublicKey(walletAddress);
            const signatureBuffer = signature.length === 128 && /^[0-9a-f]+$/i.test(signature)
                ? Buffer.from(signature, 'hex')
                : Buffer.from(signature, 'base64');
            const SEP_53_PREFIX = Buffer.from('Stellar Signed Message:\n', 'utf8');
            const messageBytes = Buffer.from(challenge.message, 'utf8');
            const payload = Buffer.concat([SEP_53_PREFIX, messageBytes]);
            const messageHash = crypto.createHash('sha256').update(payload).digest();
            isValid = keypair.verify(messageHash, signatureBuffer);
            if (!isValid) {
                isValid = keypair.verify(messageBytes, signatureBuffer);
            }
        }
        catch {
            throw new common_1.BadRequestException('Invalid Stellar signature');
        }
        if (!isValid) {
            throw new common_1.BadRequestException('Signature verification failed');
        }
        this.challenges.delete(challengeId);
        const existing = await this.prisma.walletLink.findUnique({
            where: { walletAddress },
        });
        if (existing && existing.email !== email) {
            throw new common_1.BadRequestException('This wallet is already linked to another account');
        }
        const link = await this.prisma.walletLink.upsert({
            where: { walletAddress },
            update: { signature, verifiedAt: new Date() },
            create: {
                userId,
                email,
                walletAddress,
                signature,
                verifiedAt: new Date(),
            },
        });
        return { verified: true, walletAddress: link.walletAddress, verifiedAt: link.verifiedAt };
    }
    async listWallets(userId) {
        return this.prisma.walletLink.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map