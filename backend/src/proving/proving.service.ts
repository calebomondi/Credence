import { Injectable, OnModuleInit } from '@nestjs/common';
import { Noir } from '@noir-lang/noir_js';
import { Barretenberg, UltraHonkBackend, UltraHonkVerifierBackend } from '@aztec/bb.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface ProvingResult {
  proof: string;
  publicInputs: string[];
  verificationKey: string;
}

@Injectable()
export class ProvingService implements OnModuleInit {
  private circuit: any;
  private noir!: Noir;
  private bb!: Barretenberg;
  private backend!: UltraHonkBackend;
  private verifier!: UltraHonkVerifierBackend;
  private vk!: Uint8Array;
  private initialized = false;

  async onModuleInit() {
    try {
      const circuitPath = resolve(
        __dirname, '..', '..', '..',
        'circuits', 'credit_passport', 'target', 'credit_passport.json',
      );
      this.circuit = JSON.parse(readFileSync(circuitPath, 'utf-8'));

      this.noir = new Noir(this.circuit);
      await this.noir.init();

      this.bb = await Barretenberg.new({ threads: 1 });
      this.backend = new UltraHonkBackend(this.circuit.bytecode, this.bb);
      this.verifier = new UltraHonkVerifierBackend(this.bb);

      this.vk = await this.backend.getVerificationKey();

      this.initialized = true;
      console.log('ProvingService initialized successfully');
    } catch (err) {
      console.error('ProvingService initialization failed:', err);
    }
  }

  async generateProof(inputs: Record<string, string>): Promise<ProvingResult | null> {
    if (!this.initialized) return null;

    try {
      const { witness } = await this.noir.execute(inputs);

      const proofData = await this.backend.generateProof(witness);

      const verified = await this.verifier.verifyProof({
        proof: proofData.proof,
        publicInputs: proofData.publicInputs,
        verificationKey: this.vk,
      });

      if (!verified) {
        console.error('Proof verification failed after generation');
        return null;
      }

      return {
        proof: Buffer.from(proofData.proof).toString('hex'),
        publicInputs: proofData.publicInputs.map((pi: any) => pi.toString()),
        verificationKey: Buffer.from(this.vk).toString('hex'),
      };
    } catch (err) {
      console.error('Proof generation failed:', err);
      return null;
    }
  }

  async getVerificationKey(): Promise<string | null> {
    if (!this.initialized) return null;
    return Buffer.from(this.vk).toString('hex');
  }
}
