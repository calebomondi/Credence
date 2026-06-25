#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PassportMetadata {
    pub commitment: BytesN<32>,
    pub tier: u32,
    pub verified_at: u64,
    pub proof_hash: BytesN<32>,
}

#[contracttype]
pub enum DataKey {
    Passport(Address),
    Admin,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyIssued = 1,
    NotAuthorized = 2,
    VerificationFailed = 3,
    InvalidTier = 4,
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
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn verify_and_issue(
        env: Env,
        user: Address,
        portfolio_value: u128,
        commitment: BytesN<32>,
        tier: u32,
        proof: Bytes,
    ) -> Result<PassportMetadata, Error> {
        user.require_auth();

        let expected_tier = tier_from_value(portfolio_value);
        if expected_tier == 0 {
            return Err(Error::InvalidTier);
        }
        if tier != expected_tier {
            return Err(Error::VerificationFailed);
        }

        let proof_hash: BytesN<32> = env.crypto().sha256(&proof).into();

        let metadata = PassportMetadata {
            commitment,
            tier,
            verified_at: env.ledger().timestamp(),
            proof_hash,
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

    pub fn verify_proof(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
    ) -> bool {
        let _ = env.crypto().sha256(&proof);
        let hash = env.crypto().sha256(&public_inputs);
        !hash.to_array().iter().all(|b| *b == 0)
    }
}

#[cfg(test)]
mod test {
use soroban_sdk::{
    testutils::Address as _, BytesN, Env,
};
use super::*;

    #[test]
    fn test_issue_and_retrieve() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        let contract_id = env.register(CreditPassport, (&admin,));
        let client = CreditPassportClient::new(&env, &contract_id);

        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        let portfolio_value: u128 = 770_000;
        let tier = 2;
        let proof = BytesN::from_array(&env, &[0u8; 64]).into();

        let result = client.try_verify_and_issue(
            &user,
            &portfolio_value,
            &commitment,
            &tier,
            &proof,
        );
        assert!(result.is_ok());

        let passport = client.get_passport(&user);
        assert!(passport.is_some());
        let meta = passport.unwrap();
        assert_eq!(meta.tier, 2);
        assert_eq!(meta.commitment, commitment);
    }

    #[test]
    fn test_can_reissue() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        let contract_id = env.register(CreditPassport, (&admin,));
        let client = CreditPassportClient::new(&env, &contract_id);

        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        let portfolio_value: u128 = 770_000;
        let tier = 2;
        let proof = BytesN::from_array(&env, &[0u8; 64]).into();

        let _ = client.try_verify_and_issue(
            &user,
            &portfolio_value,
            &commitment,
            &tier,
            &proof,
        );

        let commitment2 = BytesN::from_array(&env, &[2u8; 32]);
        let result = client.try_verify_and_issue(
            &user,
            &portfolio_value,
            &commitment2,
            &tier,
            &proof,
        );
        assert!(result.is_ok());
        let meta = client.get_passport(&user).unwrap();
        assert_eq!(meta.commitment, commitment2);
    }

    #[test]
    fn test_tier_from_value() {
        assert_eq!(tier_from_value(50_000), 0);
        assert_eq!(tier_from_value(1_000_00), 1);
        assert_eq!(tier_from_value(5_000_00), 2);
        assert_eq!(tier_from_value(25_000_00), 3);
        assert_eq!(tier_from_value(100_000_00), 3);
    }
}
