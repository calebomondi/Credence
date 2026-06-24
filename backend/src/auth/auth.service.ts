import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private challenges = new Map<string, { message: string; address: string; expiresAt: Date }>();

  constructor(private prisma: PrismaService) {}

  async createChallenge(address: string) {
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
        if (val.expiresAt < now) this.challenges.delete(key);
      }
    }

    return { challenge: message, challengeId };
  }

  async checkWallet(walletAddress: string) {
    const existing = await this.prisma.walletLink.findUnique({
      where: { walletAddress },
    });

    if (!existing) {
      return { status: 'available' };
    }

    return { status: 'linked', walletAddress: existing.walletAddress, verifiedAt: existing.verifiedAt };
  }

  async verifyWallet(walletAddress: string, signature: string, challengeId: string, userId: string, email: string) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new BadRequestException('Challenge not found or expired');
    }
    if (challenge.address !== walletAddress) {
      throw new BadRequestException('Challenge does not match wallet');
    }
    if (challenge.expiresAt < new Date()) {
      this.challenges.delete(challengeId);
      throw new BadRequestException('Challenge expired');
    }

    // Verify Stellar signature
    let isValid = false;
    try {
      const keypair = Keypair.fromPublicKey(walletAddress);
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
    } catch {
      throw new BadRequestException('Invalid Stellar signature');
    }

    if (!isValid) {
      throw new BadRequestException('Signature verification failed');
    }

    this.challenges.delete(challengeId);

    // Check if wallet is already linked to another user
    const existing = await this.prisma.walletLink.findUnique({
      where: { walletAddress },
    });
    if (existing && existing.email !== email) {
      throw new BadRequestException('This wallet is already linked to another account');
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

  async listWallets(userId: string) {
    return this.prisma.walletLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
