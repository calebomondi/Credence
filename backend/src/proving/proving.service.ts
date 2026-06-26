import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

export interface Groth16Proof {
  a: string;
  b: string;
  c: string;
}

export interface ProvingResult {
  proof: Groth16Proof;
  publicSignals: string[];
}

@Injectable()
export class ProvingService {
  private proverPath: string;
  private pkPath: string;

  constructor() {
    this.proverPath = resolve(
      __dirname, '..', '..', '..',
      'backend', 'prover', 'target', 'release', 'credence-prover',
    );
    this.pkPath = resolve(
      __dirname, '..', '..', '..',
      'backend', 'prover', 'pk.bin',
    );
  }

  async generateProof(value: number, threshold: number): Promise<ProvingResult | null> {
    try {
      const tmpFile = `/tmp/proof-${crypto.randomUUID()}.json`;
      await execFileAsync(this.proverPath, [
        'prove',
        '--pk', this.pkPath,
        '--value', value.toString(),
        '--threshold', threshold.toString(),
        '--output', tmpFile,
      ]);
      const data = JSON.parse(readFileSync(tmpFile, 'utf-8'));
      unlinkSync(tmpFile);
      return {
        proof: { a: data.a, b: data.b, c: data.c },
        publicSignals: data.public_signals,
      };
    } catch (err) {
      console.error('Proof generation failed:', err);
      return null;
    }
  }
}
