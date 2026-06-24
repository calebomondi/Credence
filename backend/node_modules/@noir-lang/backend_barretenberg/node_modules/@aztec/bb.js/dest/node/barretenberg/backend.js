import { Barretenberg } from './index.js';
import { RawBuffer } from '../types/raw_buffer.js';
export class UltraPlonkBackend {
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
                    const os = await import('os');
                    this.options.threads = os.cpus().length;
                }
                catch (e) {
                    console.log('Could not detect environment. Falling back to one thread.', e);
                }
            }
            const api = await Barretenberg.new(this.options);
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
export class UltraHonkBackend {
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
                    const os = await import('os');
                    this.options.threads = os.cpus().length;
                }
                catch (e) {
                    console.log('Could not detect environment. Falling back to one thread.', e);
                }
            }
            const api = await Barretenberg.new(this.options);
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
        return await this.api.acirVerifyUltraHonk(proof, new RawBuffer(vkBuf));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iYXJyZXRlbmJlcmcvYmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQWtCLFlBQVksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUMxRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFFbkQsTUFBTSxPQUFPLGlCQUFpQjtJQVU1QixZQUFzQix3QkFBb0MsRUFBWSxVQUEwQixFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7UUFBeEYsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFZO1FBQVksWUFBTyxHQUFQLE9BQU8sQ0FBaUM7SUFBRyxDQUFDO0lBRWxILGNBQWM7SUFDZCxLQUFLLENBQUMsV0FBVztRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDZCxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1lBQ3ZELENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUM7b0JBQ0gsTUFBTSxFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQzFDLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLDJEQUEyRCxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxDQUFDO1lBQ0gsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFakQsTUFBTSxh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