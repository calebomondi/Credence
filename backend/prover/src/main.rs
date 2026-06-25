use ark_bls12_381::{Bls12_381, Fr};
use ark_ff::{BigInteger, PrimeField};
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

// Circuit: Prove knowledge of a value with equality check against threshold.
// Public: threshold (2 Fr vars)
// Private: value (2 Fr vars)
// Constraint: value == threshold
// Can be upgraded to >= comparison later with UInt64 bit decomposition.
#[derive(Clone)]
struct ThresholdCircuit {
    value: Option<u128>,
    threshold: Option<u128>,
}

impl ConstraintSynthesizer<Fr> for ThresholdCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        type FrVar = ark_r1cs_std::fields::fp::FpVar<Fr>;

        let val_low = FrVar::new_witness(cs.clone(), || {
            Ok(Fr::from((self.value.unwrap_or(0) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;
        let val_high = FrVar::new_witness(cs.clone(), || {
            Ok(Fr::from(((self.value.unwrap_or(0) >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;

        let thr_low = FrVar::new_input(cs.clone(), || {
            Ok(Fr::from((self.threshold.unwrap_or(0) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;
        let thr_high = FrVar::new_input(cs.clone(), || {
            Ok(Fr::from(((self.threshold.unwrap_or(0) >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64))
        })?;

        val_low.enforce_equal(&thr_low)?;
        val_high.enforce_equal(&thr_high)?;

        Ok(())
    }
}

fn g1_to_hex(point: &ark_bls12_381::G1Affine) -> String {
    let mut buf = Vec::new();
    point.serialize_uncompressed(&mut buf).unwrap();
    hex::encode(&buf)
}

fn g2_to_hex(point: &ark_bls12_381::G2Affine) -> String {
    let mut buf = Vec::new();
    point.serialize_uncompressed(&mut buf).unwrap();
    hex::encode(&buf)
}

fn fr_to_hex(fr: &Fr) -> String {
    let bytes: Vec<u8> = fr.into_bigint().to_bytes_be();
    hex::encode(&bytes)
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
        ic: vk.gamma_abc_g1.iter().map(g1_to_hex).collect(),
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
    let vk =
        VerifyingKey::<Bls12_381>::deserialize_with_mode(&*vk_bytes, Compress::No, Validate::No)
            .map_err(|e| format!("VK deserialize error: {e:?}"))?;

    let proof_json: SorobanProof =
        serde_json::from_str(&std::fs::read_to_string(proof_path)?)?;

    let public_signals: Vec<Fr> = proof_json
        .public_signals
        .iter()
        .map(|h| {
            let bytes = hex::decode(h).unwrap();
            Fr::from_be_bytes_mod_order(&bytes)
        })
        .collect();

    let a_bytes = hex::decode(&proof_json.a)?;
    let a = ark_bls12_381::G1Affine::deserialize_with_mode(
        &*a_bytes,
        Compress::No,
        Validate::No,
    )?;
    let b_bytes = hex::decode(&proof_json.b)?;
    let b = ark_bls12_381::G2Affine::deserialize_with_mode(
        &*b_bytes,
        Compress::No,
        Validate::No,
    )?;
    let c_bytes = hex::decode(&proof_json.c)?;
    let c = ark_bls12_381::G1Affine::deserialize_with_mode(
        &*c_bytes,
        Compress::No,
        Validate::No,
    )?;

    let proof = ark_groth16::Proof { a, b, c };

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
