#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bls12_381::{
        Bls12381Fr, Bls12381G1Affine, Bls12381G2Affine,
    },
    vec, Address, BytesN, Env, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct VerificationKey {
    pub alpha: Bls12381G1Affine,
    pub beta: Bls12381G2Affine,
    pub gamma: Bls12381G2Affine,
    pub delta: Bls12381G2Affine,
    pub ic: Vec<Bls12381G1Affine>,
}

#[contracttype]
#[derive(Clone)]
pub struct Groth16Proof {
    pub a: Bls12381G1Affine,
    pub b: Bls12381G2Affine,
    pub c: Bls12381G1Affine,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PassportMetadata {
    pub commitment: BytesN<32>,
    pub tier: u32,
    pub verified_at: u64,
    pub vascore: u32,
    pub wallet_count: u32,
}

#[contracttype]
pub enum DataKey {
    Passport(Address),
    Admin,
    VerificationKey,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyIssued = 1,
    NotAuthorized = 2,
    VerificationFailed = 3,
    InvalidTier = 4,
    InvalidProof = 5,
}

const SILVER_THRESHOLD: u128 = 1_000_00;
const GOLD_THRESHOLD: u128 = 5_000_00;
const PLATINUM_THRESHOLD: u128 = 25_000_00;

pub fn tier_from_value(value: u128) -> u32 {
    if value >= PLATINUM_THRESHOLD {
        3
    } else if value >= GOLD_THRESHOLD {
        2
    } else if value >= SILVER_THRESHOLD {
        1
    } else {
        0
    }
}

#[contract]
pub struct CreditPassport;

#[contractimpl]
impl CreditPassport {
    pub fn __constructor(env: Env, admin: Address, vk: VerificationKey) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VerificationKey, &vk);
    }

    pub fn verify_and_issue(
        env: Env,
        user: Address,
        proof: Groth16Proof,
        public_signals: Vec<Bls12381Fr>,
        portfolio_value: u128,
        commitment: BytesN<32>,
        tier: u32,
        vascore: u32,
        wallet_count: u32,
    ) -> Result<PassportMetadata, Error> {
        user.require_auth();

        let vk: VerificationKey = env.storage()
            .instance()
            .get(&DataKey::VerificationKey)
            .ok_or(Error::InvalidProof)?;

        if !verify_groth16(&env, &vk, &proof, &public_signals) {
            return Err(Error::InvalidProof);
        }

        let expected_tier = tier_from_value(portfolio_value);
        if expected_tier == 0 {
            return Err(Error::InvalidTier);
        }
        if tier != expected_tier {
            return Err(Error::VerificationFailed);
        }

        let metadata = PassportMetadata {
            commitment,
            tier,
            verified_at: env.ledger().timestamp(),
            vascore,
            wallet_count,
        };

        env.storage().persistent().set(&DataKey::Passport(user), &metadata);

        Ok(metadata)
    }

    pub fn get_passport(env: Env, user: Address) -> Option<PassportMetadata> {
        env.storage().persistent().get(&DataKey::Passport(user))
    }

    pub fn has_passport(env: Env, user: Address) -> bool {
        env.storage().persistent().has(&DataKey::Passport(user))
    }

    pub fn set_verification_key(env: Env, admin: Address, vk: VerificationKey) {
        admin.require_auth();
        let stored_admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap();
        if admin != stored_admin {
            panic!("not authorized");
        }
        env.storage().instance().set(&DataKey::VerificationKey, &vk);
    }

    pub fn get_verification_key(env: Env) -> Option<VerificationKey> {
        env.storage().instance().get(&DataKey::VerificationKey)
    }
}

fn verify_groth16(
    env: &Env,
    vk: &VerificationKey,
    proof: &Groth16Proof,
    public_signals: &Vec<Bls12381Fr>,
) -> bool {
    let bls = env.crypto().bls12_381();

    if public_signals.len() + 1 != vk.ic.len() {
        return false;
    }

    let mut vk_x = vk.ic.get(0).unwrap();
    for i in 0..public_signals.len() {
        let s = public_signals.get(i).unwrap();
        let v = vk.ic.get(i + 1).unwrap();
        let prod = bls.g1_mul(&v, &s);
        vk_x = bls.g1_add(&vk_x, &prod);
    }

    let neg_a = -(proof.a.clone());
    let vp1 = vec![env, neg_a, vk.alpha.clone(), vk_x, proof.c.clone()];
    let vp2 = vec![env, proof.b.clone(), vk.beta.clone(), vk.gamma.clone(), vk.delta.clone()];

    bls.pairing_check(vp1, vp2)
}

#[cfg(test)]
mod test {
    use soroban_sdk::{
        testutils::Address as _, BytesN, Env, U256,
    };
    use super::*;

    fn g1_identity(env: &Env) -> Bls12381G1Affine {
        let mut b = [0u8; 96];
        b[0] = 0x40;
        Bls12381G1Affine::from_bytes(BytesN::from_array(env, &b))
    }

    fn g2_identity(env: &Env) -> Bls12381G2Affine {
        let mut b = [0u8; 192];
        b[0] = 0x40;
        Bls12381G2Affine::from_bytes(BytesN::from_array(env, &b))
    }

    fn make_vk(env: &Env) -> VerificationKey {
        let id1 = g1_identity(env);
        let id2 = g2_identity(env);
        VerificationKey {
            alpha: id1.clone(),
            beta: id2.clone(),
            gamma: id2.clone(),
            delta: id2.clone(),
            ic: vec![env, id1.clone(), id1.clone()],
        }
    }

    fn make_dummy_proof(env: &Env) -> Groth16Proof {
        let id1 = g1_identity(env);
        let id2 = g2_identity(env);
        Groth16Proof {
            a: id1,
            b: id2,
            c: g1_identity(env),
        }
    }

    #[test]
    fn test_constructor_sets_vk() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let vk = make_vk(&env);
        let contract_id = env.register(CreditPassport, (&admin, &vk));
        let client = CreditPassportClient::new(&env, &contract_id);

        let stored_vk = client.get_verification_key();
        assert_eq!(stored_vk.is_some(), true);
    }

    #[test]
    fn test_issue_and_retrieve() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let vk = make_vk(&env);

        let contract_id = env.register(CreditPassport, (&admin, &vk));
        let client = CreditPassportClient::new(&env, &contract_id);

        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        let portfolio_value: u128 = 770_000;
        let tier = 2;
        let vascore: u32 = 75;
        let wallet_count: u32 = 3;

        let meta = client.verify_and_issue(
            &user,
            &make_dummy_proof(&env),
            &vec![&env, Bls12381Fr::from_u256(U256::from_u32(&env, 0))],
            &portfolio_value,
            &commitment,
            &tier,
            &vascore,
            &wallet_count,
        );
        assert_eq!(meta.tier, 2);
        assert_eq!(meta.commitment, commitment);
        assert_eq!(meta.vascore, 75);
        assert_eq!(meta.wallet_count, 3);

        let passport = client.get_passport(&user);
        assert!(passport.is_some());
        let meta = passport.unwrap();
        assert_eq!(meta.tier, 2);
        assert_eq!(meta.commitment, commitment);
        assert_eq!(meta.vascore, 75);
        assert_eq!(meta.wallet_count, 3);
    }

    #[test]
    fn test_tier_validation() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let vk = make_vk(&env);

        let contract_id = env.register(CreditPassport, (&admin, &vk));
        let client = CreditPassportClient::new(&env, &contract_id);

        let commitment = BytesN::from_array(&env, &[1u8; 32]);

        // Portfolio below minimum should fail
        let result = client.try_verify_and_issue(
            &user,
            &make_dummy_proof(&env),
            &vec![&env, Bls12381Fr::from_u256(U256::from_u32(&env, 0))],
            &50_000u128,
            &commitment,
            &1u32,
            &50u32,
            &1u32,
        );
        assert_eq!(result, Err(Ok(Error::InvalidTier)));

        // Tier mismatch should fail
        let result = client.try_verify_and_issue(
            &user,
            &make_dummy_proof(&env),
            &vec![&env, Bls12381Fr::from_u256(U256::from_u32(&env, 0))],
            &770_000u128,
            &commitment,
            &1u32,
            &50u32,
            &1u32,
        );
        assert_eq!(result, Err(Ok(Error::VerificationFailed)));
    }

    #[test]
    fn test_set_verification_key() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let vk1 = make_vk(&env);

        let contract_id = env.register(CreditPassport, (&admin, &vk1));
        let client = CreditPassportClient::new(&env, &contract_id);

        let vk2 = make_vk(&env);
        client.set_verification_key(&admin, &vk2);
        let stored = client.get_verification_key().unwrap();
        assert_eq!(stored.alpha, vk2.alpha);
    }

    #[test]
    fn test_vascore_and_wallet_count_in_passport() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let vk = make_vk(&env);

        let contract_id = env.register(CreditPassport, (&admin, &vk));
        let client = CreditPassportClient::new(&env, &contract_id);

        let passport = client.get_passport(&user);
        assert_eq!(passport, None);

        let exists = client.has_passport(&user);
        assert_eq!(exists, false);
    }

}
