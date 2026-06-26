# Crypto Credit Passport

> Prove your crypto portfolio value and on-chain activity history on Stellar — without revealing your wallet addresses.

A zero-knowledge credit scoring system built on **Stellar + Soroban + Groth16 (BLS12-381)**. Users generate Groth16 ZK proofs via a Rust prover binary, submit them to a Soroban contract that verifies the proof using Stellar's native BLS12-381 pairing host functions (CAP-0059), and mint a privacy-preserving passport on Stellar Testnet.

## Architecture

```mermaid
graph TB
  subgraph Browser["Browser (Next.js 16)"]
    L["Landing /"]
    D["Dashboard /dashboard"]
    GP["Generate Proof /generate-proof"]
    P["Passport /passport"]
    S["Search /search"]
    V["Verify /verify/[id]"]
  end

  subgraph Backend["Backend (NestJS :4000)"]
    PC["PortfolioController<br/>POST /api/portfolio"]
    PAC["PassportController<br/>prepare / confirm / my<br/>search / verify / :email"]
    AC["AuthController<br/>challenge / wallets<br/>/me"]
    VC["VascoreController<br/>POST /api/vascore"]

    PS["PortfolioService<br/>Horizon + CoinGecko"]
    PAS["PassportService<br/>proof orchestration + VAScore"]
    PRS["ProvingService<br/>child_process.execFile → credence-prover"]
    VS["VascoreService<br/>8-signal scoring"]
    AS["AuthService<br/>SEP-53 challenges"]

    DB[("SQLite<br/>Commitment<br/>WalletLink<br/>IssuedPassport")]
  end

  subgraph Prover["Rust Prover Binary (credence-prover)"]
    CIRCUIT["ThresholdCircuit<br/>(R1CS: value == threshold)"]
    GROTH16["ark-groth16<br/>proof generation"]
  end

  subgraph External["External"]
    H[("Stellar Horizon<br/>Testnet")]
    CG[("CoinGecko<br/>XLM Price")]
    SUPA[("Supabase<br/>Google Auth")]
    FRE["Freighter Wallet"]
    SOR[("Soroban Contract<br/>Stellar Testnet")]
  end

  D --> SUPA
  GP --> FRE
  GP -->|"verify_and_issue (Groth16Proof, public_signals, vascore, wallet_count)"| SOR
  PAC --> DB
  PAC --> PS
  PAC --> PRS
  PAC --> VS
  PS --> H
  PS --> CG
  AC --> SUPA
  AC --> DB
  VC --> VS
  VS --> H

  PRS -->|"execFile"| Prover
  Prover -->|"JSON {a, b, c, public_signals}"| PRS

  L -.->|"navigate"| D
  D -.->|"navigate"| GP
  GP -.->|"navigate"| P
  P -.->|"navigate"| V
  S --> PAC
```

## Flows

### Proof Generation & Passport Issuance

```mermaid
sequenceDiagram
  actor U as User
  participant F as Frontend
  participant B as Backend (NestJS)
  participant P as credence-prover (Rust binary)
  participant H as Stellar Horizon
  participant S as Soroban Contract

  U->>F: Select tier (Silver/Gold/Platinum)
  F->>B: GET /api/portfolio {stellarAddresses}
  B->>H: Fetch XLM balances
  B->>H: Fetch XLM price (via CoinGecko)
  B-->>F: { totalValueUsd }
  F->>B: POST /api/passport/prepare {portfolioValue, tier, userEmail}
  B->>B: Look up WalletLinks for user email
  B->>VS: computeMultiWallet(addresses) → combined VAScore
  B->>B: threshold = getThresholdForTier(tier)
  B->>B: portfolioValue_cents = Math.round(portfolioValue * 100)
  B->>P: execFile credence-prover prove --value {cents} --threshold {cents}
  P->>P: R1CS constraint: value == threshold (2 Fr witnesses + 2 Fr public inputs)
  P->>P: Groth16::prove(pk, circuit, rng) → {A∈G1, B∈G2, C∈G1}
  P-->>B: JSON {a: hex96, b: hex192, c: hex, public_signals: [hex32, hex32]}
  B->>B: Compute commitment = sha256(value, nonce)
  B->>B: Store Commitment (vascore, walletCount, tier) in SQLite
  B-->>F: { commitment, tier, proof, publicSignals, vascore, walletCount, nonce }
  F->>F: Build ScVals: Address, Groth16Proof (scvMap a/b/c), Vec<Bls12381Fr> public_signals, u128 portfolio, Bytes commitment, u32 tier, u32 vascore, u32 walletCount
  F->>S: simulate + assemble + sign + send verify_and_issue()
  S->>S: verify_groth16(vk, proof, public_signals) via bls12_381.pairing_check()
  S->>S: validate tier, store PassportMetadata {commitment, tier, vascore, wallet_count}
  S-->>F: transaction success
  F->>B: POST /api/passport/confirm {commitment} (JWT)
  B->>B: re-compute VAScore from WalletLinks
  B->>B: create IssuedPassport (frozen snapshot)
  B-->>F: { issued }
```

### Wallet Binding Flow

```mermaid
sequenceDiagram
  actor U as User
  participant F as Frontend
  participant B as Backend
  participant SU as Supabase
  participant W as Freighter (Stellar)

  U->>F: Click "Sign in with Google"
  F->>SU: OAuth redirect
  SU-->>F: session with access_token
  U->>F: Connect Freighter wallet
  F->>W: getAddress()
  W-->>F: stellarAddress
  F->>B: POST /api/auth/wallets/check {walletAddress} (Bearer token)
  B->>B: check WalletLink table
  B-->>F: { status: "available" | "linked" }
  F->>B: POST /api/auth/challenge {address}
  B->>B: create challenge with nonce + expiry
  B-->>F: { challengeId, message }
  F->>W: signMessage(message)
  W-->>F: signature
  F->>B: POST /api/auth/wallets/verify {walletAddress, signature, challengeId} (Bearer token)
  B->>B: verify SEP-53 signature
  B->>B: create WalletLink (email bound)
  B-->>F: { success, walletAddress }
```

### Passport Verification & Search

```mermaid
sequenceDiagram
  actor V as Visitor
  participant F as Frontend
  participant B as Backend
  participant DB as SQLite

  V->>F: Navigate to /verify/[commitmentHash]
  F->>B: GET /api/passport/verify/:commitmentHash
  B->>DB: findFirst Commitment where commitment = hash
  B->>DB: findFirst IssuedPassport where commitment = hash
  DB-->>B: { commit, issued }
  B-->>F: { tier, commitment, holderEmail, combinedScore, scoreLevel, walletCount, proofHash, createdAt, verifiedAt }
  F->>F: Render FlipPassportCard

  alt Search by email or hash
    V->>F: Enter query in /search
    F->>B: GET /api/passport/search?q=
    B->>DB: try commitment match, then email substring
    B-->>F: same shape as verify
    F->>F: Render FlipPassportCard
  end
```

## Directory Tree

```
stellar-hack/
├── circuits/credit_passport/       # (Reference) Original Noir ZK circuit — no longer used
├── contracts/credit-passport/      # Soroban smart contract with Groth16 BLS12-381 verifier
│   ├── src/lib.rs                  # verify_and_issue, verify_groth16, set VK, get_passport
│   ├── Cargo.toml                  # soroban-sdk 27.0.0-rc.1
│   └── test_snapshots/             # Snapshot-based tests
├── backend/                        # NestJS API — proof orchestration, portfolio, auth, scoring
│   ├── src/
│   │   ├── passport/               # controller + service (prepare, confirm, my, search, verify)
│   │   ├── portfolio/              # Stellar Horizon balance aggregation + CoinGecko price
│   │   ├── proving/                # execFile wrapper around credence-prover Rust binary
│   │   ├── vascore/                # 8-signal credit scoring (controller + service + types)
│   │   ├── auth/                   # Supabase JWT guard + wallet challenge/verify
│   │   ├── prisma/                 # Global module + service (Prisma 7 + libSQL adapter)
│   │   ├── lib/supabase-admin.ts   # Lazy Supabase admin client
│   │   ├── app.module.ts           # Root module
│   │   └── main.ts                 # Bootstrap (port 4000)
│   ├── prover/                     # Rust Groth16 prover binary
│   │   ├── src/main.rs             # ThresholdCircuit R1CS + setup/prove/verify commands
│   │   ├── Cargo.toml              # ark-bls12-381 0.4, ark-groth16 0.4, clap, serde, hex
│   │   ├── pk.bin                  # Proving key (~3.9 KB)
│   │   ├── vk.json                 # Verification key (Soroban format, JSON)
│   │   └── target/release/credence-prover  # Compiled binary (build artifact)
│   └── prisma/
│       ├── schema.prisma           # 3 models: Commitment, WalletLink, IssuedPassport
│       └── dev.db                  # SQLite database
├── frontend/                       # Next.js 16 dApp — 6 routes, 14 components
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Landing page (hero, how-it-works, CTA)
│   │   │   ├── layout.tsx                  # Root layout (Manrope + Inter fonts, providers)
│   │   │   ├── providers.tsx               # Theme + StellarWallet + Auth providers
│   │   │   ├── globals.css                 # CSS variables (light/dark), Tailwind v4 directives
│   │   │   ├── middleware.ts               # Supabase SSR session refresh
│   │   │   ├── auth/callback/route.ts      # Supabase OAuth code exchange
│   │   │   ├── dashboard/page.tsx          # Wallet management + passport status + VAScore
│   │   │   ├── generate-proof/page.tsx     # Tier selection → portfolio → ZK proof → Stellar tx
│   │   │   ├── passport/page.tsx           # Credential card display + PDF download
│   │   │   ├── search/page.tsx             # Public search by email or commitment hash
│   │   │   └── verify/[id]/page.tsx        # Public verification page
│   │   ├── components/
│   │   │   ├── FlipPassportCard.tsx        # 3D-tilt flip card (shared by hero, verify, search)
│   │   │   ├── HeroPassportCard.tsx        # Demo Gold-tier flip card for landing page
│   │   │   ├── passport-card.tsx           # Full passport card (desktop horizontal + mobile vertical)
│   │   │   ├── InteractivePassportCard.tsx  # Legacy tilt card
│   │   │   ├── PassportSeal.tsx            # SVG "ZK VERIFIED" shield seal
│   │   │   ├── QRDisplay.tsx               # QR code from url using qrcode library
│   │   │   ├── WalletManager.tsx           # Linked wallets table + tiers + scores + connect UI
│   │   │   ├── StellarWalletButton.tsx     # Freighter connect/disconnect
│   │   │   ├── GoogleSignInButton.tsx      # Supabase Google OAuth button
│   │   │   ├── Header.tsx                  # Sticky header (logo, wallet, auth, theme toggle)
│   │   │   ├── AmbientBackground.tsx       # Animated gradient orbs (light/dark aware)
│   │   │   ├── ThemeToggle.tsx             # Light/dark mode switch
│   │   │   ├── ComparisonIllustration.tsx  # Traditional vs Crypto credit signals side-by-side
│   │   │   └── LenderViewComparison.tsx    # What lender sees vs what stays private
│   │   └── lib/
│   │       ├── api.ts                      # 13 API client functions
│   │       ├── stellar-wallet-context.tsx   # Freighter wallet React context (+ signTransaction)
│   │       ├── theme-context.tsx           # Theme state + localStorage persistence
│   │       ├── use-auth.ts                 # Supabase auth hook (user, session, signIn, signOut)
│   │       └── supabase/
│   │           ├── client.ts               # Lazy browser Supabase client singleton
│   │           └── server.ts               # SSR Supabase client for middleware
│   ├── public/
│   │   ├── Credence.png                    # App logo
│   │   └── Icon.png                        # Favicon
│   ├── next.config.ts                      # Google profile images remote pattern
│   └── package.json                        # next@16, freighter-api, stellar-sdk, supabase-ssr, etc.
├── README.md                               # This file
```

## First-time Setup

```bash
# 1. Install tooling
rustup target add wasm32v1-none

# 2. Build Soroban contract
cd contracts/credit-passport
cargo build --release --target wasm32v1-none
cd ../..

# 3. Build Rust prover binary
cd backend/prover
cargo build --release
cd ../..

# 4. Generate proving key + verification key
cd backend/prover
./target/release/credence-prover setup
# → pk.bin, vk.bin, vk.json
cd ../..

# 5. Upload VK to deployed contract (first deploy only)
# stellar contract invoke --network testnet ... set_verification_key --admin <addr> --vk <JSON>

# 6. Backend — install deps + create database
cd backend
cp .env.example .env   # edit with your values
npm install
npx prisma db push
npx prisma generate
cd ..

# 7. Frontend — install deps
cd frontend
cp .env.local.example .env.local   # edit with your values
npm install
cd ..
```

## Running

```bash
# Terminal 1 — Backend (port 4000)
cd backend
npm run build && npm run start:prod

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Verify:

```bash
curl http://localhost:4000/api/portfolio -X POST \
  -H 'Content-Type: application/json' \
  -d '{"stellarAddresses":["GDQNY..."]}'
# → {"totalValueUsd":...}

curl http://localhost:3000
# → HTML page
```

## Stopping

```bash
kill $(lsof -ti :4000)   # stop backend
kill $(lsof -ti :3000)   # stop frontend
```

## Prerequisites

| Tool | Required Version | Install |
|------|----------------|---------|
| Rust | 1.85+ | `rustup target add wasm32v1-none` |
| Node.js | 24.x | via nvm |
| stellar-cli | 27.0.0 | via install script |

**Rust prover dependencies** (all auto-installed via `cargo build`):
| Crate | Version | Purpose |
|-------|---------|---------|
| ark-bls12-381 | 0.4.0 | BLS12-381 curve implementation |
| ark-groth16 | 0.4.0 | Groth16 proof system |
| ark-r1cs-std | 0.4.0 | R1CS constraint generation |
| ark-ff / ark-serialize / ark-ec | 0.4.0 | Field arithmetic, serialization, curve types |

## Deployed Contract

| Network | Contract ID |
|---------|-------------|
| Stellar Testnet | `CBRFQ6BBNJNC6HF33MG6KT5AFWXQ6EPICZOMIPQR7EAQGESNKNRHC37X` |

[Explorer Link](https://stellar.expert/explorer/testnet/contract/CBRFQ6BBNJNC6HF33MG6KT5AFWXQ6EPICZOMIPQR7EAQGESNKNRHC37X)

## Tier Thresholds

All portfolio values are scaled to **cents** (multiplied by 100) before entering the prover circuit and contract.

| Tier | Portfolio Threshold | Circuit/Contract Threshold (cents) |
|------|-------------------|------------------------------------|
| 1 — Silver | >= $1,000 | 100000 |
| 2 — Gold | >= $5,000 | 500000 |
| 3 — Platinum | >= $25,000 | 2500000 |

## Zero-Knowledge Proof System

### Circuit (Rust / Arkworks R1CS)

Located at `backend/prover/src/main.rs`. The `ThresholdCircuit` defines an R1CS constraint system:

```
value_lo == threshold_lo
value_hi == threshold_hi
```

- 2 **private** witnesses: `value_lo`, `value_hi` (128-bit portfolio value split into two 64-bit Fr field elements)
- 2 **public** inputs: `threshold_lo`, `threshold_hi`
- Proves the prover knows a `value` that equals the public `threshold` without revealing the value itself
- The equality constraint is enforced via `FrVar::enforce_equal`, generating 2 R1CS constraints
- Upgradable to `>=` comparison using UInt64 bit decomposition when needed

### Proof Generation (credence-prover binary)

The Rust binary at `backend/prover/` has three commands:

| Command | Description |
|---------|-------------|
| `setup` | Runs `Groth16::<Bls12_381>::circuit_specific_setup` → produces proving key (`pk.bin`, 3.9KB) + verification key (`vk.bin` + `vk.json` for Soroban) |
| `prove` | Loads PK, runs `Groth16::prove(pk, circuit, rng)` → produces Groth16 proof as JSON with `a` (G1, 96 hex bytes), `b` (G2, 192 hex bytes), `c` (G1), `public_signals` (2× Fr, 32 hex bytes each) |
| `verify` | Loads VK + proof JSON, runs `Groth16::verify(vk, public_signals, proof)` → prints PASS/FAIL |

The backend calls `prove` via `child_process.execFile` with the user's portfolio value (cents) and the tier threshold. The proof JSON is parsed and returned to the frontend.

### On-Chain Verification (Soroban)

The contract's `verify_groth16` function at `contracts/credit-passport/src/lib.rs:150` reconstructs the pairing check:

```
vk_x = ic[0] + Σ(signal[i] · ic[i+1])         // G1 multi-scalar multiplication
vp1 = [-proof.a, vk.alpha, vk_x, proof.c]      // Vec<G1Affine>
vp2 = [proof.b, vk.beta, vk.gamma, vk.delta]   // Vec<G2Affine>
result = pairing_check(vp1, vp2)               // true if product == 1
```

Uses Stellar's `env.crypto().bls12_381().pairing_check()` host function (CAP-0059) — no WASM, no Rust crypto dependencies in the contract.

### Why Groth16 + BLS12-381?

- Groth16 produces the smallest proofs (3 group elements: 96 + 192 + 96 bytes)
- BLS12-381 pairings are supported natively by Stellar's CAP-0059 host functions
- Verification is a single `pairing_check` call (~41M CPU / ~297KB memory budget)
- The same curve (BLS12-381) is mandated by CAP-0059 for ZK use cases on Stellar

## VAScore Formula

The VAScore is computed off-chain from Stellar Horizon data. Eight signals weighted and normalized 0–100:

| Signal | Weight | Source |
|--------|--------|--------|
| Portfolio Value (XLM + U) | 30% | Horizon account balances |
| Account Age | 15% | Account creation timestamp |
| Transaction Frequency (per month) | 15% | Payment operations / months active |
| Failed Transaction Ratio (inverted) | 10% | Failed operations / total |
| Average Payment Volume | 10% | Total sent / total payments |
| Incoming/Outgoing Ratio | 5% | Payments received / payments sent |
| Trustline Count | 5% | Number of trustlines (capped at 20) |
| Consistency (months with activity) | 10% | Unique months with ≥1 payment |

Level mapping: **A** (80–100), **B** (65–79), **C** (50–64), **D** (35–49), **E** (20–34), **F** (0–19).

Multi-wallet combination: max age, summed portfolio, pooled transaction counts across all verified wallets.

## Data Model

```mermaid
erDiagram
  Commitment {
    string id PK
    string stellarUser
    string commitment "SHA-256 hash"
    int tier
    string nonce
    string proofHash
    datetime createdAt
  }
  WalletLink {
    string id PK
    string userId "Supabase user ID"
    string email
    string walletAddress "Stellar G-address, globally unique"
    string signature "SEP-53 signed challenge"
    string status "verified"
    datetime verifiedAt
    datetime createdAt
  }
  IssuedPassport {
    string id PK
    string userEmail
    string commitment
    int tier
    datetime verifiedAt
    string proofHash
    int combinedScore "Frozen VAScore 0-100"
    string scoreLevel "A-F"
    int walletCount
    datetime createdAt
  }
  WalletLink ||--o{ Commitment : "email matches stellarUser"
  WalletLink ||--o{ IssuedPassport : "email matches userEmail"
```

## Notes

- **Groth16 on BLS12-381** via `ark-groth16` produces proofs with 3 group elements (A: G1 96B, B: G2 192B, C: G1 96B). Proving key is ~3.9KB. The equality circuit uses 2 private witnesses + 2 public inputs (128-bit values split into Fr elements).
- **The prover binary** (`credence-prover`) is built from Rust and invoked via `child_process.execFile`. The backend resolves its path relative to `__dirname`. The `setup` command must be run once to generate `pk.bin` and `vk.json` before proof generation works.
- **On-chain verification** uses `env.crypto().bls12_381().pairing_check()` — a single host function that computes the product of 4 pairings and returns `true` if the result equals 1 in the target group. No WASM, no Rust crypto in the contract.
- **`verify_groth16`** reconstructs `vk_x` using `g1_mul` and `g1_add` host functions, then negates `proof.a` (negation is implemented for `&Bls12381G1Affine` via wrapping `from_bytes` on the negated coordinates).
- **`user.require_auth()`** means the caller signs the transaction — no admin key needed for issuance.
- **Passport is a frozen snapshot** — the combined VAScore and wallet count are captured at issuance time (`confirmPassport`) and stored in `IssuedPassport`. They do not update when new wallets are linked later.
- **Portfolio values** are multiplied by 100 (cents) for the circuit and contract to avoid floating-point issues.
- **Supabase Auth**: Google OAuth only. Wallet binding is Stellar-only (EVM removed). Wallets are permanently bound to one email via `WalletLink` table.
- **Route ordering matters**: `GET /api/passport/my` and `GET /api/passport/search` are declared before `GET /api/passport/:userEmail` to avoid `my` / `search` being matched as a userEmail parameter.
- **Horizon endpoint**: `https://horizon-testnet.stellar.org`; CoinGecko cache TTL: 60s; fallback XLM price: $0.10.
- **Soroswap DEX price route** (unused fallback): The PortfolioService has a commented-out Soroswap path for USDC priced in XLM via the Soroswap AMM. Currently uses hardcoded USDC price of $1.00.

## API Endpoint Summary

### Portfolio

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/portfolio` | None | Aggregate Stellar portfolio (XLM at market price + USDC) |

### Passport

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/passport/prepare` | None | Generate Groth16 ZK proof + compute VAScore + store commitment |
| GET | `/api/passport/my` | Bearer JWT | Current user's frozen IssuedPassport |
| POST | `/api/passport/confirm` | Bearer JWT | Freeze snapshot after on-chain issuance |
| GET | `/api/passport/search?q=` | None | Search by email (substring) or commitment hash (exact) |
| GET | `/api/passport/verify/:commitmentHash` | None | Verify passport by commitment hash |
| GET | `/api/passport/:userEmail` | None | Minimal lookup by email |

### Auth / Wallets

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/auth/me` | Bearer JWT | Current user from Supabase |
| POST | `/api/auth/challenge` | None | Create Stellar SEP-53 signing challenge |
| POST | `/api/auth/wallets/check` | Bearer JWT | Check if a wallet address is already linked |
| POST | `/api/auth/wallets/verify` | Bearer JWT | Verify wallet ownership via signature |
| GET | `/api/auth/wallets` | Bearer JWT | List all linked wallets for current user |

### VAScore

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/vascore` | None | Compute score for given Stellar addresses |

## Frontend Component Tree

```
providers.tsx
├── ThemeProvider (theme-context.tsx)
│   └── localStorage persistence
├── StellarWalletProvider (stellar-wallet-context.tsx)
│   └── Freighter connect/disconnect/signMessage/signTransaction
└── layout.tsx
    ├── Header.tsx
    │   ├── Logo (Credence.png)
    │   ├── StellarWalletButton.tsx
    │   ├── GoogleSignInButton.tsx
    │   └── ThemeToggle.tsx
    ├── Landing (page.tsx)
    │   ├── AmbientBackground.tsx
    │   ├── HeroPassportCard.tsx (FlipPassportCard with demo data)
    │   ├── ComparisonIllustration.tsx
    │   └── LenderViewComparison.tsx
    ├── Dashboard (/dashboard)
    │   ├── AmbientBackground.tsx
    │   ├── WalletManager.tsx (wallet table, tiers, scores, verify flow)
    │   ├── PassportCard (passport-card.tsx)
    │   └── GoogleSignInButton.tsx
    ├── Generate Proof (/generate-proof)
    │   ├── AmbientBackground.tsx
    │   └── Tier selection + step progress + Stellar submission
    ├── Passport (/passport)
    │   ├── PassportCard (passport-card.tsx)
    │   ├── PassportSeal.tsx
    │   ├── QRDisplay.tsx
    │   └── PDF export (html-to-image + jsPDF)
    ├── Search (/search)
    │   ├── Search input
    │   └── FlipPassportCard.tsx
    └── Verify (/verify/[id])
        └── FlipPassportCard.tsx
```

## License

MIT
