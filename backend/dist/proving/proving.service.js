"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvingService = void 0;
const common_1 = require("@nestjs/common");
const noir_js_1 = require("@noir-lang/noir_js");
const bb_js_1 = require("@aztec/bb.js");
const fs_1 = require("fs");
const path_1 = require("path");
let ProvingService = class ProvingService {
    circuit;
    noir;
    bb;
    backend;
    verifier;
    vk;
    initialized = false;
    async onModuleInit() {
        try {
            const circuitPath = (0, path_1.resolve)(__dirname, '..', '..', '..', 'circuits', 'credit_passport', 'target', 'credit_passport.json');
            this.circuit = JSON.parse((0, fs_1.readFileSync)(circuitPath, 'utf-8'));
            this.noir = new noir_js_1.Noir(this.circuit);
            await this.noir.init();
            this.bb = await bb_js_1.Barretenberg.new({ threads: 1 });
            this.backend = new bb_js_1.UltraHonkBackend(this.circuit.bytecode, this.bb);
            this.verifier = new bb_js_1.UltraHonkVerifierBackend(this.bb);
            this.vk = await this.backend.getVerificationKey();
            this.initialized = true;
            console.log('ProvingService initialized successfully');
        }
        catch (err) {
            console.error('ProvingService initialization failed:', err);
        }
    }
    async generateProof(inputs) {
        if (!this.initialized)
            return null;
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
                publicInputs: proofData.publicInputs.map((pi) => pi.toString()),
                verificationKey: Buffer.from(this.vk).toString('hex'),
            };
        }
        catch (err) {
            console.error('Proof generation failed:', err);
            return null;
        }
    }
    async getVerificationKey() {
        if (!this.initialized)
            return null;
        return Buffer.from(this.vk).toString('hex');
    }
};
exports.ProvingService = ProvingService;
exports.ProvingService = ProvingService = __decorate([
    (0, common_1.Injectable)()
], ProvingService);
//# sourceMappingURL=proving.service.js.map