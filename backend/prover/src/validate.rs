use ark_bls12_381::{Fr, Fq, Fq2, G1Affine, G2Affine, Bls12_381};
use ark_ff::{BigInteger, PrimeField};
use ark_ec::AffineRepr;
use ark_groth16::Groth16;
use ark_snark::SNARK;
use ark_std::rand::{rngs::StdRng, SeedableRng};
use ark_serialize::{CanonicalDeserialize, Compress, Validate};

fn g1_to_hex(point: &G1Affine) -> String {
    let (x, y) = point.xy().expect("point should not be identity");
    hex::encode([x.into_bigint().to_bytes_be(), y.into_bigint().to_bytes_be()].concat())
}

fn g2_to_hex(point: &G2Affine) -> String {
    let (x, y) = point.xy().expect("point should not be identity");
    hex::encode([
        x.c0.into_bigint().to_bytes_be(),
        x.c1.into_bigint().to_bytes_be(),
        y.c0.into_bigint().to_bytes_be(),
        y.c1.into_bigint().to_bytes_be(),
    ].concat())
}

fn g1_from_hex(s: &str) -> Result<G1Affine, Box<dyn std::error::Error>> {
    let bytes = hex::decode(s)?;
    if bytes.len() != 96 {
        return Err("G1: expected 96 bytes".into());
    }
    let x = Fq::from_be_bytes_mod_order(&bytes[..48]);
    let y = Fq::from_be_bytes_mod_order(&bytes[48..]);
    Ok(G1Affine::new(x, y))
}

fn g2_from_hex(s: &str) -> Result<G2Affine, Box<dyn std::error::Error>> {
    let bytes = hex::decode(s)?;
    if bytes.len() != 192 {
        return Err("G2: expected 192 bytes".into());
    }
    let x_c0 = Fq::from_be_bytes_mod_order(&bytes[..48]);
    let x_c1 = Fq::from_be_bytes_mod_order(&bytes[48..96]);
    let y_c0 = Fq::from_be_bytes_mod_order(&bytes[96..144]);
    let y_c1 = Fq::from_be_bytes_mod_order(&bytes[144..]);
    let x = Fq2::new(x_c0, x_c1);
    let y = Fq2::new(y_c0, y_c1);
    Ok(G2Affine::new(x, y))
}

use ark_r1cs_std::prelude::*;
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};

struct ThresholdCircuit {
    value: Option<u128>,
    threshold: Option<u128>,
}

impl ConstraintSynthesizer<Fr> for ThresholdCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        type FrVar = ark_r1cs_std::fields::fp::FpVar<Fr>;
        let val_low = FrVar::new_witness(cs.clone(), || Ok(Fr::from((self.value.unwrap_or(0) & 0xFFFF_FFFF_FFFF_FFFF) as u64)))?;
        let val_high = FrVar::new_witness(cs.clone(), || Ok(Fr::from(((self.value.unwrap_or(0) >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64)))?;
        let thr_low = FrVar::new_input(cs.clone(), || Ok(Fr::from((self.threshold.unwrap_or(0) & 0xFFFF_FFFF_FFFF_FFFF) as u64)))?;
        let thr_high = FrVar::new_input(cs.clone(), || Ok(Fr::from(((self.threshold.unwrap_or(0) >> 64) & 0xFFFF_FFFF_FFFF_FFFF) as u64)))?;
        val_low.enforce_equal(&thr_low)?;
        val_high.enforce_equal(&thr_high)?;
        Ok(())
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Round-trip VK through hex
    let vk_bytes = std::fs::read("vk.bin")?;
    let vk = ark_groth16::VerifyingKey::<Bls12_381>::deserialize_with_mode(&*vk_bytes, Compress::No, Validate::No)?;

    let alpha_hex = g1_to_hex(&vk.alpha_g1);
    let beta_hex = g2_to_hex(&vk.beta_g2);
    let gamma_hex = g2_to_hex(&vk.gamma_g2);
    let delta_hex = g2_to_hex(&vk.delta_g2);

    let alpha_back = g1_from_hex(&alpha_hex)?;
    let beta_back = g2_from_hex(&beta_hex)?;
    let gamma_back = g2_from_hex(&gamma_hex)?;
    let delta_back = g2_from_hex(&delta_hex)?;

    assert_eq!(alpha_back, vk.alpha_g1, "alpha mismatch!");
    assert_eq!(beta_back, vk.beta_g2, "beta mismatch!");
    assert_eq!(gamma_back, vk.gamma_g2, "gamma mismatch!");
    assert_eq!(delta_back, vk.delta_g2, "delta mismatch!");
    println!("✅ VK round-trip: PASS");

    // Round-trip proof through hex
    let mut rng = StdRng::from_seed(Default::default());
    let pk = ark_groth16::ProvingKey::<Bls12_381>::deserialize_with_mode(&*std::fs::read("pk.bin")?, Compress::No, Validate::No)?;
    let circuit = ThresholdCircuit { value: Some(100000), threshold: Some(100000) };
    let proof = Groth16::<Bls12_381>::prove(&pk, circuit, &mut rng)?;

    let a_hex = g1_to_hex(&proof.a);
    let b_hex = g2_to_hex(&proof.b);
    let c_hex = g1_to_hex(&proof.c);

    let a_back = g1_from_hex(&a_hex)?;
    let b_back = g2_from_hex(&b_hex)?;
    let c_back = g1_from_hex(&c_hex)?;

    assert_eq!(a_back, proof.a, "a mismatch!");
    assert_eq!(b_back, proof.b, "b mismatch!");
    assert_eq!(c_back, proof.c, "c mismatch!");
    println!("✅ Proof round-trip: PASS");

    // Check: first bytes of each point (relevant for Soroban flag bytes)
    println!("\nFirst byte analysis:");
    let alpha_bytes = hex::decode(&alpha_hex)?;
    println!("  alpha first byte: 0x{:02x} (bit6={}, bit7={})",
        alpha_bytes[0], (alpha_bytes[0] >> 6) & 1, (alpha_bytes[0] >> 7) & 1);

    let a_bytes = hex::decode(&a_hex)?;
    println!("  proof.a first byte: 0x{:02x} (bit6={}, bit7={})",
        a_bytes[0], (a_bytes[0] >> 6) & 1, (a_bytes[0] >> 7) & 1);

    // Verify all group elements are on curve
    assert!(vk.alpha_g1.is_on_curve(), "alpha not on curve!");
    println!("✅ All points on curve: PASS");

    // Verify the proof with arkworks
    let public_signals = vec![
        Fr::from_be_bytes_mod_order(&hex::decode("00000000000000000000000000000000000000000000000000000000000186a0")?),
        Fr::from_be_bytes_mod_order(&hex::decode("0000000000000000000000000000000000000000000000000000000000000000")?),
    ];
    let result = Groth16::<Bls12_381>::verify(&vk, &public_signals, &proof)?;
    println!("✅ arkworks verify: {}", if result { "PASS" } else { "FAIL" });

    Ok(())
}
