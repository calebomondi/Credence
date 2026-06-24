"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarretenbergApiSync = exports.BarretenbergApi = void 0;
const index_js_1 = require("../serialize/index.js");
const index_js_2 = require("../types/index.js");
class BarretenbergApi {
    constructor(wasm) {
        this.wasm = wasm;
    }
    async pedersenCommit(inputsBuffer, ctxIndex) {
        const inArgs = [inputsBuffer, ctxIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point];
        const result = await this.wasm.callWasmExport('pedersen_commit', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async pedersenHash(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = await this.wasm.callWasmExport('pedersen_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async pedersenHashes(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = await this.wasm.callWasmExport('pedersen_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async pedersenHashBuffer(inputBuffer, hashIndex) {
        const inArgs = [inputBuffer, hashIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = await this.wasm.callWasmExport('pedersen_hash_buffer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async poseidon2Hash(inputsBuffer) {
        const inArgs = [inputsBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = await this.wasm.callWasmExport('poseidon2_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async poseidon2Hashes(inputsBuffer) {
        const inArgs = [inputsBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = await this.wasm.callWasmExport('poseidon2_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async poseidon2Permutation(inputsBuffer) {
        const inArgs = [inputsBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = await this.wasm.callWasmExport('poseidon2_permutation', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async blake2s(data) {
        const inArgs = [data].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer32];
        const result = await this.wasm.callWasmExport('blake2s', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async blake2sToField(data) {
        const inArgs = [data].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = await this.wasm.callWasmExport('blake2s_to_field_', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrComputePublicKey(privateKey) {
        const inArgs = [privateKey].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point];
        const result = await this.wasm.callWasmExport('schnorr_compute_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrNegatePublicKey(publicKeyBuffer) {
        const inArgs = [publicKeyBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point];
        const result = await this.wasm.callWasmExport('schnorr_negate_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrConstructSignature(message, privateKey) {
        const inArgs = [message, privateKey].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer32, index_js_2.Buffer32];
        const result = await this.wasm.callWasmExport('schnorr_construct_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrVerifySignature(message, pubKey, sigS, sigE) {
        const inArgs = [message, pubKey, sigS, sigE].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('schnorr_verify_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrMultisigCreateMultisigPublicKey(privateKey) {
        const inArgs = [privateKey].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer128];
        const result = await this.wasm.callWasmExport('schnorr_multisig_create_multisig_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrMultisigValidateAndCombineSignerPubkeys(signerPubkeyBuf) {
        const inArgs = [signerPubkeyBuf].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point, (0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('schnorr_multisig_validate_and_combine_signer_pubkeys', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrMultisigConstructSignatureRound1() {
        const inArgs = [].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer128, index_js_2.Buffer128];
        const result = await this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_1', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrMultisigConstructSignatureRound2(message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf) {
        const inArgs = [message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fq, (0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_2', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrMultisigCombineSignatures(message, signerPubkeysBuf, roundOneBuf, roundTwoBuf) {
        const inArgs = [message, signerPubkeysBuf, roundOneBuf, roundTwoBuf].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer32, index_js_2.Buffer32, (0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('schnorr_multisig_combine_signatures', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async aesEncryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('aes_encrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async aesDecryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('aes_decrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async srsInitSrs(pointsBuf, numPoints, g2PointBuf) {
        const inArgs = [pointsBuf, numPoints, g2PointBuf].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('srs_init_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async srsInitGrumpkinSrs(pointsBuf, numPoints) {
        const inArgs = [pointsBuf, numPoints].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('srs_init_grumpkin_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async examplesSimpleCreateAndVerifyProof() {
        const inArgs = [].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('examples_simple_create_and_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async testThreads(threads, iterations) {
        const inArgs = [threads, iterations].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.NumberDeserializer)()];
        const result = await this.wasm.callWasmExport('test_threads', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async commonInitSlabAllocator(circuitSize) {
        const inArgs = [circuitSize].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('common_init_slab_allocator', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirGetCircuitSizes(constraintSystemBuf, honkRecursion) {
        const inArgs = [constraintSystemBuf, honkRecursion].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.NumberDeserializer)(), (0, index_js_1.NumberDeserializer)(), (0, index_js_1.NumberDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_get_circuit_sizes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async acirNewAcirComposer(sizeHint) {
        const inArgs = [sizeHint].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Ptr];
        const result = await this.wasm.callWasmExport('acir_new_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirDeleteAcirComposer(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_delete_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirInitProvingKey(acirComposerPtr, constraintSystemBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_init_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirCreateProof(acirComposerPtr, constraintSystemBuf, witnessBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_create_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirProveAndVerifyUltraHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_prove_and_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirProveAndVerifyMegaHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_prove_and_verify_mega_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirFoldAndVerifyProgramStack(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_fold_and_verify_program_stack', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirLoadVerificationKey(acirComposerPtr, vkBuf) {
        const inArgs = [acirComposerPtr, vkBuf].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_load_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirInitVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_init_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirGetVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_get_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirGetProvingKey(acirComposerPtr, acirVec) {
        const inArgs = [acirComposerPtr, acirVec].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_get_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirVerifyProof(acirComposerPtr, proofBuf) {
        const inArgs = [acirComposerPtr, proofBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirGetSolidityVerifier(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.StringDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_get_solidity_verifier', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirSerializeProofIntoFields(acirComposerPtr, proofBuf, numInnerPublicInputs) {
        const inArgs = [acirComposerPtr, proofBuf, numInnerPublicInputs].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = await this.wasm.callWasmExport('acir_serialize_proof_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirSerializeVerificationKeyIntoFields(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr), index_js_2.Fr];
        const result = await this.wasm.callWasmExport('acir_serialize_verification_key_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async acirProveUltraHonk(acirVec, witnessVec) {
        const inArgs = [acirVec, witnessVec].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_prove_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirVerifyUltraHonk(proofBuf, vkBuf) {
        const inArgs = [proofBuf, vkBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirWriteVkUltraHonk(acirVec) {
        const inArgs = [acirVec].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = await this.wasm.callWasmExport('acir_write_vk_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirProofAsFieldsUltraHonk(proofBuf) {
        const inArgs = [proofBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = await this.wasm.callWasmExport('acir_proof_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirVkAsFieldsUltraHonk(vkBuf) {
        const inArgs = [vkBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = await this.wasm.callWasmExport('acir_vk_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
}
exports.BarretenbergApi = BarretenbergApi;
class BarretenbergApiSync {
    constructor(wasm) {
        this.wasm = wasm;
    }
    pedersenCommit(inputsBuffer, ctxIndex) {
        const inArgs = [inputsBuffer, ctxIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point];
        const result = this.wasm.callWasmExport('pedersen_commit', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    pedersenHash(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = this.wasm.callWasmExport('pedersen_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    pedersenHashes(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = this.wasm.callWasmExport('pedersen_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    pedersenHashBuffer(inputBuffer, hashIndex) {
        const inArgs = [inputBuffer, hashIndex].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = this.wasm.callWasmExport('pedersen_hash_buffer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    poseidon2Hash(inputsBuffer) {
        const inArgs = [inputsBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = this.wasm.callWasmExport('poseidon2_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    poseidon2Hashes(inputsBuffer) {
        const inArgs = [inputsBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = this.wasm.callWasmExport('poseidon2_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    poseidon2Permutation(inputsBuffer) {
        const inArgs = [inputsBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = this.wasm.callWasmExport('poseidon2_permutation', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    blake2s(data) {
        const inArgs = [data].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer32];
        const result = this.wasm.callWasmExport('blake2s', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    blake2sToField(data) {
        const inArgs = [data].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fr];
        const result = this.wasm.callWasmExport('blake2s_to_field_', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrComputePublicKey(privateKey) {
        const inArgs = [privateKey].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point];
        const result = this.wasm.callWasmExport('schnorr_compute_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrNegatePublicKey(publicKeyBuffer) {
        const inArgs = [publicKeyBuffer].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point];
        const result = this.wasm.callWasmExport('schnorr_negate_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrConstructSignature(message, privateKey) {
        const inArgs = [message, privateKey].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer32, index_js_2.Buffer32];
        const result = this.wasm.callWasmExport('schnorr_construct_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrVerifySignature(message, pubKey, sigS, sigE) {
        const inArgs = [message, pubKey, sigS, sigE].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('schnorr_verify_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrMultisigCreateMultisigPublicKey(privateKey) {
        const inArgs = [privateKey].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer128];
        const result = this.wasm.callWasmExport('schnorr_multisig_create_multisig_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrMultisigValidateAndCombineSignerPubkeys(signerPubkeyBuf) {
        const inArgs = [signerPubkeyBuf].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Point, (0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('schnorr_multisig_validate_and_combine_signer_pubkeys', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrMultisigConstructSignatureRound1() {
        const inArgs = [].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer128, index_js_2.Buffer128];
        const result = this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_1', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrMultisigConstructSignatureRound2(message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf) {
        const inArgs = [message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Fq, (0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_2', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrMultisigCombineSignatures(message, signerPubkeysBuf, roundOneBuf, roundTwoBuf) {
        const inArgs = [message, signerPubkeysBuf, roundOneBuf, roundTwoBuf].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Buffer32, index_js_2.Buffer32, (0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('schnorr_multisig_combine_signatures', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    aesEncryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('aes_encrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    aesDecryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('aes_decrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    srsInitSrs(pointsBuf, numPoints, g2PointBuf) {
        const inArgs = [pointsBuf, numPoints, g2PointBuf].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('srs_init_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    srsInitGrumpkinSrs(pointsBuf, numPoints) {
        const inArgs = [pointsBuf, numPoints].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('srs_init_grumpkin_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    examplesSimpleCreateAndVerifyProof() {
        const inArgs = [].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('examples_simple_create_and_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    testThreads(threads, iterations) {
        const inArgs = [threads, iterations].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.NumberDeserializer)()];
        const result = this.wasm.callWasmExport('test_threads', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    commonInitSlabAllocator(circuitSize) {
        const inArgs = [circuitSize].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('common_init_slab_allocator', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirGetCircuitSizes(constraintSystemBuf, honkRecursion) {
        const inArgs = [constraintSystemBuf, honkRecursion].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.NumberDeserializer)(), (0, index_js_1.NumberDeserializer)(), (0, index_js_1.NumberDeserializer)()];
        const result = this.wasm.callWasmExport('acir_get_circuit_sizes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    acirNewAcirComposer(sizeHint) {
        const inArgs = [sizeHint].map(index_js_1.serializeBufferable);
        const outTypes = [index_js_2.Ptr];
        const result = this.wasm.callWasmExport('acir_new_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirDeleteAcirComposer(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_delete_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirInitProvingKey(acirComposerPtr, constraintSystemBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_init_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirCreateProof(acirComposerPtr, constraintSystemBuf, witnessBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('acir_create_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirProveAndVerifyUltraHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('acir_prove_and_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirProveAndVerifyMegaHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('acir_prove_and_verify_mega_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirFoldAndVerifyProgramStack(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('acir_fold_and_verify_program_stack', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirLoadVerificationKey(acirComposerPtr, vkBuf) {
        const inArgs = [acirComposerPtr, vkBuf].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_load_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirInitVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_init_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirGetVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('acir_get_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirGetProvingKey(acirComposerPtr, acirVec) {
        const inArgs = [acirComposerPtr, acirVec].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('acir_get_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirVerifyProof(acirComposerPtr, proofBuf) {
        const inArgs = [acirComposerPtr, proofBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('acir_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirGetSolidityVerifier(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.StringDeserializer)()];
        const result = this.wasm.callWasmExport('acir_get_solidity_verifier', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirSerializeProofIntoFields(acirComposerPtr, proofBuf, numInnerPublicInputs) {
        const inArgs = [acirComposerPtr, proofBuf, numInnerPublicInputs].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = this.wasm.callWasmExport('acir_serialize_proof_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirSerializeVerificationKeyIntoFields(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr), index_js_2.Fr];
        const result = this.wasm.callWasmExport('acir_serialize_verification_key_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    acirProveUltraHonk(acirVec, witnessVec) {
        const inArgs = [acirVec, witnessVec].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('acir_prove_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirVerifyUltraHonk(proofBuf, vkBuf) {
        const inArgs = [proofBuf, vkBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BoolDeserializer)()];
        const result = this.wasm.callWasmExport('acir_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirWriteVkUltraHonk(acirVec) {
        const inArgs = [acirVec].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.BufferDeserializer)()];
        const result = this.wasm.callWasmExport('acir_write_vk_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirProofAsFieldsUltraHonk(proofBuf) {
        const inArgs = [proofBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = this.wasm.callWasmExport('acir_proof_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirVkAsFieldsUltraHonk(vkBuf) {
        const inArgs = [vkBuf].map(index_js_1.serializeBufferable);
        const outTypes = [(0, index_js_1.VectorDeserializer)(index_js_2.Fr)];
        const result = this.wasm.callWasmExport('acir_vk_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
}
exports.BarretenbergApiSync = BarretenbergApiSync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnX2FwaS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxvREFRK0I7QUFDL0IsZ0RBQTRFO0FBRTVFLE1BQWEsZUFBZTtJQUMxQixZQUFzQixJQUE0QjtRQUE1QixTQUFJLEdBQUosSUFBSSxDQUF3QjtJQUFHLENBQUM7SUFFdEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFrQixFQUFFLFFBQWdCO1FBQ3ZELE1BQU0sTUFBTSxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyw4QkFBbUIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sUUFBUSxHQUFpQixDQUFDLGdCQUFLLENBQUMsQ0FBQztRQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUMzQyxpQkFBaUIsRUFDakIsTUFBTSxFQUNOLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQ25DLENBQUM7UUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLFlBQWtCLEVBQUUsU0FBaUI7UUFDdEQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLDhCQUFtQixDQUFDLENBQUM7UUFDbEUsTUFBTSxRQUFRLEdBQWlCLENBQUMsYUFBRSxDQUFDLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQUcsTUFB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