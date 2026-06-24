import { OnModuleInit } from '@nestjs/common';
export interface ProvingResult {
    proof: string;
    publicInputs: string[];
    verificationKey: string;
}
export declare class ProvingService implements OnModuleInit {
    private circuit;
    private noir;
    private bb;
    private backend;
    private verifier;
    private vk;
    private initialized;
    onModuleInit(): Promise<void>;
    generateProof(inputs: Record<string, string>): Promise<ProvingResult | null>;
    getVerificationKey(): Promise<string | null>;
}
