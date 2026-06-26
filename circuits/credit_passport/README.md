# Credit Passport — Original Noir Circuit (Deprecated)

> **⚠️ This circuit is no longer used in production.** It has been replaced by a Rust Arkworks R1CS circuit at `backend/prover/src/main.rs`. See below for details.

## History

The original circuit was written in **Noir** (v1.0.0-beta.22) and proved `portfolio_value >= threshold` with a single `assert(!portfolio_value.lt(threshold))` constraint. It compiled to ACIR bytecode (`~50KB`) and was verified off-chain via UltraHonk WASM (`@aztec/bb.js`).

## Why It Was Replaced

| Factor | Old (Noir + UltraHonk) | New (Rust + Groth16) |
|--------|----------------------|---------------------|
| Proof scheme | UltraHonk (transparent, no trusted setup) | **Groth16** (smallest proofs, fastest verification) |
| Proof size | ~10KB | **384 bytes** (96 + 192 + 96) |
| On-chain verification | SHA-256 placeholder (not real ZK) | **Real on-chain verifier** via BLS12-381 host functions (CAP-0059) |
| Proving time | ~13s cold / ~1s warm (WASM) | Sub-second (native x86-64) |
| Dependencies | 3 heavy npm WASM packages | Single Rust binary + 6 Arkworks crates |
| Prover portability | Node.js only | Any platform (binary) |

The critical driver was that **UltraHonk is not verifiable on Stellar**. There is no UltraHonk verifier available for the Soroban environment. By switching to Groth16 on BLS12-381, we can use Stellar's native `bls12_381.pairing_check()` host function (CAP-0059) for on-chain verification — the same curve mandated by Stellar for ZK use cases.

## Original Circuit

```noir
fn main(portfolio_value: Field, threshold: pub Field) {
    assert(!portfolio_value.lt(threshold));
}
```

- `portfolio_value` — private witness (hidden from verifier)
- `threshold` — public input (visible on-chain)
- Proved `portfolio_value >= threshold`

## Files (kept for reference)

| File | Purpose |
|------|---------|
| `src/main.nr` | Original circuit definition |
| `Nargo.toml` | Package manifest |
| `Prover.toml` | Example inputs for `nargo execute` |
| `Verifier.toml` | Expected public inputs |
| `target/credit_passport.json` | Compiled ACIR bytecode |

## Current Production Circuit

See `backend/prover/src/main.rs` — a Rust R1CS circuit using `ark-r1cs-std`:

- **Equality constraint**: `value == threshold` (2× 64-bit limbs)
- **2 public inputs**, **2 private witnesses**
- **Scheme**: Groth16 over BLS12-381 (`ark-groth16`)
- **Proof**: 3 group elements (A: G1, B: G2, C: G1) → 384 bytes uncompressed
- **Verification**: On-chain via Stellar `bls12_381.pairing_check()`
