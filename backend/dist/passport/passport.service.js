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
exports.PassportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const proving_service_1 = require("../proving/proving.service");
const vascore_service_1 = require("../vascore/vascore.service");
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
let PassportService = class PassportService {
    prisma;
    proving;
    vascore;
    constructor(prisma, proving, vascore) {
        this.prisma = prisma;
        this.proving = proving;
        this.vascore = vascore;
    }
    async prepareProof(portfolioValue, tier, userEmail) {
        const threshold = this.getThresholdForTier(tier);
        const nonce = crypto.randomUUID().replace(/-/g, '');
        const proofResult = await this.proving.generateProof({
            portfolio_value: Math.round(portfolioValue * 100).toString(),
            threshold: threshold.toString(),
        });
        const proofHex = proofResult?.proof ?? ('0x' + '00'.repeat(128));
        const publicInputs = proofResult?.publicInputs ?? [];
        const vkHex = proofResult?.verificationKey ?? '';
        const commitment = this.sha256(portfolioValue.toString(), nonce);
        const proofHash = this.sha256(proofHex, vkHex);
        await this.prisma.commitment.create({
            data: {
                stellarUser: userEmail,
                commitment,
                tier,
                nonce,
                proofHash,
            },
        });
        return {
            commitment,
            tier,
            proof: proofHex,
            publicInputs,
            verificationKey: vkHex,
            nonce,
        };
    }
    async getPassport(userEmail) {
        const commitment = await this.prisma.commitment.findFirst({
            where: { stellarUser: userEmail },
            orderBy: { createdAt: 'desc' },
        });
        if (!commitment)
            return null;
        return {
            commitment: commitment.commitment,
            tier: commitment.tier,
            createdAt: commitment.createdAt,
        };
    }
    async verifyPassport(commitmentHash) {
        const commit = await this.prisma.commitment.findFirst({
            where: { commitment: commitmentHash },
        });
        if (!commit)
            return null;
        const issued = await this.prisma.issuedPassport.findFirst({
            where: { commitment: commitmentHash },
            orderBy: { createdAt: 'desc' },
        });
        return {
            commitment: commit.commitment,
            tier: commit.tier,
            proofHash: commit.proofHash,
            createdAt: commit.createdAt,
            holderEmail: commit.stellarUser,
            combinedScore: issued?.combinedScore ?? null,
            scoreLevel: issued?.scoreLevel ?? null,
            walletCount: issued?.walletCount ?? null,
            verifiedAt: issued?.verifiedAt ?? null,
        };
    }
    async searchPassport(query) {
        const isHash = query.startsWith('0x') || /^[a-f0-9]{64}$/i.test(query);
        if (isHash) {
            const result = await this.verifyPassport(query);
            if (result)
                return result;
        }
        const issued = await this.prisma.issuedPassport.findFirst({
            where: { userEmail: { contains: query } },
            orderBy: { createdAt: 'desc' },
        });
        if (issued) {
            const commit = await this.prisma.commitment.findFirst({
                where: { commitment: issued.commitment },
            });
            return {
                commitment: issued.commitment,
                tier: issued.tier,
                proofHash: issued.proofHash,
                createdAt: commit?.createdAt ?? issued.createdAt,
                holderEmail: issued.userEmail,
                combinedScore: issued.combinedScore,
                scoreLevel: issued.scoreLevel,
                walletCount: issued.walletCount,
                verifiedAt: issued.verifiedAt,
            };
        }
        return null;
    }
    async confirmPassport(commitment, userEmail) {
        const commit = await this.prisma.commitment.findFirst({
            where: { commitment, stellarUser: userEmail },
        });
        if (!commit)
            return null;
        const links = await this.prisma.walletLink.findMany({
            where: { email: userEmail, status: 'verified' },
        });
        const addresses = links.map((l) => l.walletAddress);
        const scoreResult = await this.vascore.computeMultiWallet(addresses).catch(() => null);
        const combined = scoreResult?.combined ?? { scoreNumeric: 0, scoreLevel: 'F', portfolioValue: 0, accountAgeMonths: 0, txFrequencyPerMonth: 0, trustlineCount: 0 };
        const issued = await this.prisma.issuedPassport.create({
            data: {
                userEmail,
                commitment: commit.commitment,
                tier: commit.tier,
                verifiedAt: new Date(),
                proofHash: commit.proofHash,
                combinedScore: combined.scoreNumeric,
                scoreLevel: combined.scoreLevel,
                walletCount: Math.max(links.length, 1),
            },
        });
        return issued;
    }
    async getMyPassport(userEmail) {
        const issued = await this.prisma.issuedPassport.findFirst({
            where: { userEmail },
            orderBy: { createdAt: 'desc' },
        });
        if (!issued)
            return null;
        return {
            commitment: issued.commitment,
            tier: issued.tier,
            verifiedAt: Math.floor(issued.verifiedAt.getTime() / 1000),
            proofHash: issued.proofHash,
            walletCount: issued.walletCount,
            combinedScore: {
                scoreNumeric: issued.combinedScore,
                scoreLevel: issued.scoreLevel,
            },
            userEmail: issued.userEmail
        };
    }
    async getOnChainPassport(stellarAddress) {
        const rpcUrl = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
        const contractId = process.env.CONTRACT_ID;
        const networkPassphrase = StellarSdk.Networks.TESTNET;
        const rpc = new StellarSdk.rpc.Server(rpcUrl);
        const account = new StellarSdk.Account(stellarAddress, '0');
        const contract = new StellarSdk.Contract(contractId);
        const userScVal = StellarSdk.Address.fromString(stellarAddress).toScVal();
        const tx = new StellarSdk.TransactionBuilder(account, {
            fee: '100',
            networkPassphrase,
        })
            .addOperation(contract.call('get_passport', userScVal))
            .setTimeout(30)
            .build();
        const simulation = await rpc.simulateTransaction(tx);
        if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
            return null;
        }
        if (!simulation.result?.retval) {
            return null;
        }
        const raw = StellarSdk.scValToNative(simulation.result.retval);
        if (!raw || typeof raw !== 'object')
            return null;
        return {
            commitment: raw.commitment ? Buffer.from(raw.commitment).toString('hex') : '',
            tier: typeof raw.tier === 'number' ? raw.tier : Number(raw.tier) || 0,
            verifiedAt: typeof raw.verified_at === 'number' ? raw.verified_at : Number(raw.verified_at) || 0,
            proofHash: raw.proof_hash ? Buffer.from(raw.proof_hash).toString('hex') : '',
            walletAddress: stellarAddress,
        };
    }
    getThresholdForTier(tier) {
        switch (tier) {
            case 1: return 100000;
            case 2: return 500000;
            case 3: return 2500000;
            default: return 100000;
        }
    }
    sha256(value, nonce) {
        const hash = require('crypto').createHash('sha256')
            .update(value + nonce)
            .digest('hex');
        return '0x' + hash;
    }
};
exports.PassportService = PassportService;
exports.PassportService = PassportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        proving_service_1.ProvingService,
        vascore_service_1.VascoreService])
], PassportService);
//# sourceMappingURL=passport.service.js.map