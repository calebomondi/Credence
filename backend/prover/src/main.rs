use ark_bls12_381::{Bls12_381, Fr, G1Affine, G2Affine};
use ark_ff::{BigInt as ArkBigInt, BigInteger as _, PrimeField};
use ark_groth16::{Groth16, ProvingKey, VerifyingKey};
use ark_r1cs_std::prelude::*;
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize, Compress, Validate};
use ark_snark::SNARK;
use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "credence-prover")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Setup {
        #[arg(short, long, default_value = "pk.bin")]
        pk_out: PathBuf,
        #[arg(short, long, default_value = "vk.bin")]
        vk_out: PathBuf,
        #[arg(short, long, default_value = "vk.json")]
        vk_json: PathBuf,
    },
    Prove {
        #[arg(short, long)]
        pk: PathBuf,
        #[arg(short, long)]
        value: u128,
        #[arg(short, long)]
        threshold: u128,
        #[arg(short, long, default_value = "proof.json")]
        output: PathBuf,
    },
    Verify {
        #[arg(short, long)]
        vk: PathBuf,
        #[arg(short, long)]
        proof: PathBuf,
    },
}

#[derive(Clone)]
struct ThresholdCircuit {
    value: Option<u128>,
    threshold: Option<u128>,
}

impl ConstraintSynthesizer<Fr> for ThresholdCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        type FrVar = ark_r1cs_std::fields::fp::FpVar<Fr>;

        let value = self.value.unwrap_or(0);
        let threshold = self.threshold.unwrap_or(0);

        // Public input: threshold as two 64-bit limbs
        let thr_low = FrVar::new_input(cs.clone(), || {
            Ok(Fr::from((threshold & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;
        let thr_high = FrVar::new_input(cs.clone(), || {
            Ok(Fr::from(((threshold >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;

        // Private witness: value as two 64-bit limbs
        let val_low = FrVar::new_witness(cs.clone(), || {
            Ok(Fr::from((value & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;
        let val_high = FrVar::new_witness(cs.clone(), || {
            Ok(Fr::from(((value >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;

        // Private witness: difference = value - threshold (must be >= 0)
        let diff = value.wrapping_sub(threshold);
        let diff_low = FrVar::new_witness(cs.clone(), || {
            Ok(Fr::from((diff & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;
        let diff_high = FrVar::new_witness(cs.clone(), || {
            Ok(Fr::from(((diff >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;

        // Enforce: val_low = thr_low + diff_low (mod field, ignoring carry for simplicity)
        let recon_low = &thr_low + &diff_low;
        recon_low.enforce_equal(&val_low)?;

        // Enforce: val_high = thr_high + diff_high
        let recon_high = &thr_high + &diff_high;
        recon_high.enforce_equal(&val_high)?;

        Ok(())
    }
}

// Convert Fr to big-endian hex (Soroban-compatible format).
// into_bigint() returns standard integer (Montgomery-reduced),
// to_bytes_be() gives 32-byte big-endian output.
fn fr_to_hex(fr: &Fr) -> String {
    hex::encode(fr.into_bigint().to_bytes_be())
}

fn fr_from_hex(s: &str) -> Fr {
    let bytes = hex::decode(s).unwrap();
    let mut limbs = [0u64; 4];
    limbs[3] = u64::from_be_bytes(bytes[0..8].try_into().unwrap());
    limbs[2] = u64::from_be_bytes(bytes[8..16].try_into().unwrap());
    limbs[1] = u64::from_be_bytes(bytes[16..24].try_into().unwrap());
    limbs[0] = u64::from_be_bytes(bytes[24..32].try_into().unwrap());
    Fr::from(ArkBigInt::<4>(limbs))
}

fn g1_to_hex(point: &G1Affine) -> String {
    let mut bytes = Vec::new();
    point.serialize_uncompressed(&mut bytes).unwrap();
    hex::encode(bytes) // 96 bytes (uncompressed: x || y)
}

fn g2_to_hex(point: &G2Affine) -> String {
    let mut bytes = Vec::new();
    point.serialize_uncompressed(&mut bytes).unwrap();
    hex::encode(bytes) // 192 bytes (uncompressed: x.c1 || x.c0 || y.c1 || y.c0)
}

#[derive(Serialize, Deserialize)]
struct SorobanVk {
    alpha: String,
    beta: String,
    gamma: String,
    delta: String,
    ic: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct SorobanProof {
    a: String,
    b: String,
    c: String,
    public_signals: Vec<String>,
}

fn setup() -> Result<(), Box<dyn std::error::Error>> {
    use ark_std::rand::{rngs::StdRng, SeedableRng};
    let mut rng = StdRng::from_seed(Default::default());
    let circuit = ThresholdCircuit {
        value: None,
        threshold: None,
    };

    let (pk, vk) = Groth16::<Bls12_381>::circuit_specific_setup(circuit, &mut rng)?;

    let mut pk_bytes = Vec::new();
    pk.serialize_with_mode(&mut pk_bytes, Compress::No)?;
    std::fs::write("pk.bin", &pk_bytes)?;

    let mut vk_bytes = Vec::new();
    vk.serialize_with_mode(&mut vk_bytes, Compress::No)?;
    std::fs::write("vk.bin", &vk_bytes)?;

    let soroban_vk = SorobanVk {
        alpha: g1_to_hex(&vk.alpha_g1),
        beta: g2_to_hex(&vk.beta_g2),
        gamma: g2_to_hex(&vk.gamma_g2),
        delta: g2_to_hex(&vk.delta_g2),
        ic: vk.gamma_abc_g1.iter().map(|p| g1_to_hex(p)).collect(),
    };

    let vk_json = serde_json::to_string_pretty(&soroban_vk)?;
    std::fs::write("vk.json", &vk_json)?;

    println!("Setup complete. VK written to vk.json (ic.len={})", soroban_vk.ic.len());
    Ok(())
}

fn prove(
    pk_path: &PathBuf,
    value: u128,
    threshold: u128,
    output: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let pk_bytes = std::fs::read(pk_path)?;
    let pk =
        ProvingKey::<Bls12_381>::deserialize_with_mode(&*pk_bytes, Compress::No, Validate::No)?;

    use ark_std::rand::{rngs::StdRng, SeedableRng};
    let mut rng = StdRng::from_seed(Default::default());

    let circuit = ThresholdCircuit {
        value: Some(value),
        threshold: Some(threshold),
    };

    let proof = Groth16::<Bls12_381>::prove(&pk, circuit, &mut rng)?;

    let soroban_proof = SorobanProof {
        a: g1_to_hex(&proof.a),
        b: g2_to_hex(&proof.b),
        c: g1_to_hex(&proof.c),
        public_signals: vec![
            fr_to_hex(&Fr::from((threshold & 0xFFFF_FFFF_FFFF_FFFF) as u64)),
            fr_to_hex(&Fr::from(((threshold >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64)),
        ],
    };

    let json = serde_json::to_string_pretty(&soroban_proof)?;
    std::fs::write(output, &json)?;
    println!("Proof generated: {}", output.display());
    Ok(())
}

fn verify(vk_path: &PathBuf, proof_path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let vk_bytes = std::fs::read(vk_path)?;
    let vk = VerifyingKey::<Bls12_381>::deserialize_with_mode(&*vk_bytes, Compress::No, Validate::No)
        .map_err(|e| format!("VK deserialize error: {e:?}"))?;

    let proof_json: SorobanProof = serde_json::from_str(&std::fs::read_to_string(proof_path)?)?;

    let public_signals: Vec<Fr> = proof_json.public_signals.iter().map(|h| {
        fr_from_hex(h)
    }).collect();

    let proof = ark_groth16::Proof {
        a: G1Affine::deserialize_uncompressed(&*hex::decode(&proof_json.a).unwrap()).unwrap(),
        b: G2Affine::deserialize_uncompressed(&*hex::decode(&proof_json.b).unwrap()).unwrap(),
        c: G1Affine::deserialize_uncompressed(&*hex::decode(&proof_json.c).unwrap()).unwrap(),
    };

    let result = Groth16::<Bls12_381>::verify(&vk, &public_signals, &proof)
        .map_err(|e| format!("verify error: {e:?}"))?;
    println!("Verification: {}", if result { "PASS" } else { "FAIL" });
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Setup { .. } => setup()?,
        Commands::Prove {
            pk,
            value,
            threshold,
            output,
        } => prove(&pk, value, threshold, &output)?,
        Commands::Verify { vk, proof } => verify(&vk, &proof)?,
    }
    Ok(())
}
