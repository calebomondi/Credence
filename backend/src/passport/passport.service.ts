import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvingService } from '../proving/proving.service';
import { VascoreService } from '../vascore/vascore.service';
import * as StellarSdk from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class PassportService {
  constructor(
    private prisma: PrismaService,
    private proving: ProvingService,
    private vascore: VascoreService,
  ) {}

  async prepareProof(portfolioValue: number, tier: number, userEmail: string) {
    const threshold = this.getThresholdForTier(tier);
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const portfolioValueCents = Math.round(portfolioValue * 100);

    const proofResult = await this.proving.generateProof(portfolioValueCents, threshold);
    if (!proofResult) return null;

    const commitment = this.sha256(portfolioValue.toString(), nonce);

    const proofHash = crypto.createHash('sha256')
      .update(proofResult.proof.a + proofResult.proof.b + proofResult.proof.c + proofResult.publicSignals.join(''))
      .digest('hex');

    const links = await this.prisma.walletLink.findMany({
      where: { email: userEmail, status: 'verified' },
    });
    const addresses = links.map(l => l.walletAddress);
    const scoreResult = await this.vascore.computeMultiWallet(addresses).catch(() => null);
    const combined = scoreResult?.combined ?? { scoreNumeric: 0, scoreLevel: 'F', portfolioValue: 0, accountAgeMonths: 0, txFrequencyPerMonth: 0, trustlineCount: 0 };

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
      proof: proofResult.proof,
      publicSignals: proofResult.publicSignals,
      proofHash,
      vascore: combined.scoreNumeric,
      walletCount: Math.max(addresses.length, 1),
      nonce,
    };
  }

  async getPassport(userEmail: string) {
    const commitment = await this.prisma.commitment.findFirst({
      where: { stellarUser: userEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!commitment) return null;

    return {
      commitment: commitment.commitment,
      tier: commitment.tier,
      createdAt: commitment.createdAt,
    };
  }

  async verifyPassport(commitmentHash: string) {
    const commit = await this.prisma.commitment.findFirst({
      where: { commitment: commitmentHash },
    });
    if (!commit) return null;

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

  async searchPassport(query: string) {
    const isHash = query.startsWith('0x') || /^[a-f0-9]{64}$/i.test(query);

    if (isHash) {
      const result = await this.verifyPassport(query);
      if (result) return result;
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

  async confirmPassport(commitment: string, userEmail: string) {
    const commit = await this.prisma.commitment.findFirst({
      where: { commitment, stellarUser: userEmail },
    });

    if (!commit) return null;

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

  async getMyPassport(userEmail: string) {
    const issued = await this.prisma.issuedPassport.findFirst({
      where: { userEmail },
      orderBy: { createdAt: 'desc' },
    });

    // console.log(`>> ${JSON.stringify(issued)}`)

    if (!issued) return null;

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
      userEmail: issued.userEmail,
    };
  }

  private async getOnChainPassport(stellarAddress: string) {
    const rpcUrl = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
    const contractId = process.env.CONTRACT_ID!;
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

    if (!raw || typeof raw !== 'object') return null;

    return {
      commitment: raw.commitment ? Buffer.from(raw.commitment).toString('hex') : '',
      tier: typeof raw.tier === 'number' ? raw.tier : Number(raw.tier) || 0,
      verifiedAt: typeof raw.verified_at === 'number' ? raw.verified_at : Number(raw.verified_at) || 0,
      proofHash: raw.proof_hash ? Buffer.from(raw.proof_hash).toString('hex') : '',
      walletAddress: stellarAddress,
    };
  }

  private getThresholdForTier(tier: number): number {
    switch (tier) {
      case 1: return 100000;
      case 2: return 500000;
      case 3: return 2500000;
      default: return 100000;
    }
  }

  private sha256(value: string, nonce: string): string {
    const hash = crypto.createHash('sha256')
      .update(value + nonce)
      .digest('hex');
    return '0x' + hash;
  }
}
