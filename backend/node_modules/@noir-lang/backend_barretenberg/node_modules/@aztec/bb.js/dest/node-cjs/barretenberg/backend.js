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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltraHonkBackend = exports.UltraPlonkBackend = void 0;
const index_js_1 = require("./index.js");
const raw_buffer_js_1 = require("../types/raw_buffer.js");
class UltraPlonkBackend {
    constructor(acirUncompressedBytecode, options = { threads: 1 }) {
        this.acirUncompressedBytecode = acirUncompressedBytecode;
        this.options = options;
    }
    /** @ignore */
    async instantiate() {
        if (!this.api) {
            if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
                this.options.threads = navigator.hardwareConcurrency;
            }
            else {
                try {
                    const os = await Promise.resolve().then(() => __importStar(require('os')));
                    this.options.threads = os.cpus().length;
                }
                catch (e) {
                    console.log('Could not detect environment. Falling back to one thread.', e);
                }
            }
            const api = await index_js_1.Barretenberg.new(this.options);
            const honkRecursion = false;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_exact, _total, subgroupSize] = await api.acirGetCircuitSizes(this.acirUncompressedBytecode, honkRecursion);
            await api.initSRSForCircuitSize(subgroupSize);
            this.acirComposer = await api.acirNewAcirComposer(subgroupSize);
            await api.acirInitProvingKey(this.acirComposer, this.acirUncompressedBytecode);
            this.api = api;
        }
    }
    /** @description Generates a proof */
    async generateProof(uncompressedWitness) {
        await this.instantiate();
        return this.api.acirCreateProof(this.acirComposer, this.acirUncompressedBytecode, uncompressedWitness);
    }
    /**
     * Generates artifacts that will be passed to a circuit that will verify this proof.
     *
     * Instead of passing the proof and verification key as a byte array, we pass them
     * as fields which makes it cheaper to verify in a circuit.
     *
     * The proof that is passed here will have been created using a circuit
     * that has the #[recursive] attribute on its `main` method.
     *
     * The number of public inputs denotes how many public inputs are in the inner proof.
     *
     * @example
     * ```typescript
     * const artifacts = await backend.generateRecursiveProofArtifacts(proof, numOfPublicInputs);
     * ```
     */
    async generateRecursiveProofArtifacts(proof, numOfPublicInputs = 0) {
        await this.instantiate();
        const proofAsFields = (await this.api.acirSerializeProofIntoFields(this.acirComposer, proof, numOfPublicInputs)).slice(numOfPublicInputs);
        // TODO: perhaps we should put this in the init function. Need to benchmark
        // TODO how long it takes.
        await this.api.acirInitVerificationKey(this.acirComposer);
        // Note: If you don't init verification key, `acirSerializeVerificationKeyIntoFields`` will just hang on serialization
        const vk = await this.api.acirSerializeVerificationKeyIntoFields(this.acirComposer);
        return {
            proofAsFields: proofAsFields.map(p => p.toString()),
            vkAsFields: vk[0].map(vk => vk.toString()),
            vkHash: vk[1].toString(),
        };
    }
    /** @description Verifies a proof */
    async verifyProof(proof) {
        await this.instantiate();
        await this.api.acirInitVerificationKey(this.acirComposer);
        return await this.api.acirVerifyProof(this.acirComposer, proof);
    }
    async getVerificationKey() {
        await this.instantiate();
        await this.api.acirInitVerificationKey(this.acirComposer);
        return await this.api.acirGetVerificationKey(this.acirComposer);
    }
    async destroy() {
        if (!this.api) {
            return;
        }
        await this.api.destroy();
    }
}
exports.UltraPlonkBackend = UltraPlonkBackend;
class UltraHonkBackend {
    constructor(acirUncompressedBytecode, options = { threads: 1 }) {
        this.acirUncompressedBytecode = acirUncompressedBytecode;
        this.options = options;
    }
    /** @ignore */
    async instantiate() {
        if (!this.api) {
            if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
                this.options.threads = navigator.hardwareConcurrency;
            }
            else {
                try {
                    const os = await Promise.resolve().then(() => __importStar(require('os')));
                    this.options.threads = os.cpus().length;
                }
                catch (e) {
                    console.log('Could not detect environment. Falling back to one thread.', e);
                }
            }
            const api = await index_js_1.Barretenberg.new(this.options);
            const honkRecursion = true;
            await api.acirInitSRS(this.acirUncompressedBytecode, honkRecursion);
            // We don't init a proving key here in the Honk API
            // await api.acirInitProvingKey(this.acirComposer, this.acirUncompressedBytecode);
            this.api = api;
        }
    }
    async generateProof(uncompressedWitness) {
        await this.instantiate();
        return this.api.acirProveUltraHonk(this.acirUncompressedBytecode, uncompressedWitness);
    }
    async verifyProof(proof) {
        await this.instantiate();
        const vkBuf = await this.api.acirWriteVkUltraHonk(this.acirUncompressedBytecode);
        return await this.api.acirVerifyUltraHonk(proof, new raw_buffer_js_1.RawBuffer(vkBuf));
    }
    async getVerificationKey() {
        await this.instantiate();
        return await this.api.acirWriteVkUltraHonk(this.acirUncompressedBytecode);
    }
    // TODO(https://github.com/noir-lang/noir/issues/5661): Update this to handle Honk recursive aggregation in the browser once it is ready in the backend itself
    async generateRecursiveProofArtifacts(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _proof, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _numOfPublicInputs) {
        await this.instantiate();
        // TODO(https://github.com/noir-lang/noir/issues/5661): This needs to be updated to handle recursive aggregation.
        // There is still a proofAsFields method but we could consider getting rid of it as the proof itself
        // is a list of field elements.
        // UltraHonk also does not have public inputs directly prepended to the proof and they are still instead
        // inserted at an offset.
        // const proof = reconstructProofWithPublicInputs(proofData);
        // const proofAsFields = (await this.api.acirProofAsFieldsUltraHonk(proof)).slice(numOfPublicInputs);
        // TODO: perhaps we should put this in the init function. Need to benchmark
        // TODO how long it takes.
        const vkBuf = await this.api.acirWriteVkUltraHonk(this.acirUncompressedBytecode);
        const vk = await this.api.acirVkAsFieldsUltraHonk(vkBuf);
        return {
            // TODO(https://github.com/noir-lang/noir/issues/5661)
            proofAsFields: [],
            vkAsFields: vk.map(vk => vk.toString()),
            // We use an empty string for the vk hash here as it is unneeded as part of the recursive artifacts
            // The user can be expected to hash the vk inside their circuit to check whether the vk is the circuit
            // they expect
            vkHash: '',
        };
    }
    async destroy() {
        if (!this.api) {
            return;
        }
        await this.api.destroy();
    }
}
exports.UltraHonkBackend = UltraHonkBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iYXJyZXRlbmJlcmcvYmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlDQUEwRDtBQUMxRCwwREFBbUQ7QUFFbkQsTUFBYSxpQkFBaUI7SUFVNUIsWUFBc0Isd0JBQW9DLEVBQVksVUFBMEIsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFO1FBQXhGLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBWTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQWlDO0lBQUcsQ0FBQztJQUVsSCxjQUFjO0lBQ2QsS0FBSyxDQUFDLFdBQVc7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztZQUN2RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDO29CQUNILE1BQU0sRUFBRSxHQUFHLHdEQUFhLElBQUksR0FBQyxDQUFDO29CQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUMxQyxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyREFBMkQsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUUsQ0FBQztZQUNILENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxNQUFNLHVCQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDNUIsNkRBQTZEO1lBQzdELE1BQU0sQ0FB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