# Backend — NestJS API (Proving Engine + Auth + Scoring)

Aggregate Stellar portfolios via Horizon, generate UltraHonk ZK proofs via bb.js WASM, manage passport commitments, compute VAScores, and handle wallet binding via Supabase JWT auth.

## Architecture

```mermaid
graph TB
  subgraph Controllers
    PC["PortfolioController"]
    PAC["PassportController"]
    AC["AuthController"]
    VC["VascoreController"]
  end

  subgraph Services
    PS["PortfolioService"]
    PAS["PassportService"]
    PRS["ProvingService"]
    AS["AuthService"]
    VS["VascoreService"]
    PRIS["PrismaService (global)"]
  end

  subgraph External
    H[("Stellar Horizon<br/>Testnet")]
    CG[("CoinGecko XLM Price")]
    SUPA[("Supabase<br/>Admin API")]
  end

  subgraph Storage
    DB[("SQLite (libSQL adapter)<br/>Commitment<br/>WalletLink<br/>IssuedPassport")]
  end

  PC --> PS
  PS --> H
  PS --> CG

  PAC --> PAS
  PAC --> PRS
  PAC --> VS
  PAS --> DB
  PAS --> PRS
  PAS --> VS

  AC --> AS
  AS --> SUPA
  AS --> DB

  VC --> VS
  VS --> H

  PRIS --> DB
```

## Module Dependency Graph

```mermaid
graph LR
  AppModule --> PassportModule
  AppModule --> PortfolioModule
  AppModule --> AuthModule
  AppModule --> VascoreModule
  AppModule --> PrismaModule[PrismaModule (Global)]
  AppModule --> ProvingModule[ProvingModule (Global)]

  PassportModule --> VascoreModule
  PassportModule --> PrismaModule
  PassportModule --> ProvingModule

  PortfolioModule --> PrismaModule

  AuthModule --> PrismaModule

  VascoreModule --> PrismaModule
```

## Modules

| Module | Exported | Description |
|--------|----------|-------------|
| **PrismaModule** | PrismaService (Global) | SQLite via Prisma 7 + `@prisma/adapter-libsql`. All services inject PrismaService. |
| **ProvingModule** | ProvingService (Global) | Wraps `@noir-lang/noir_js` witness generation + `@aztec/bb.js` UltraHonk proof generation. Loads `credit_passport.json` on init. |
| **PassportModule** | PassportService | Orchestrates proof generation, DB storage, VAScore computation, snapshot confirmation, search, and on-chain reads. |
| **PortfolioModule** | PortfolioService | Fetches XLM/USDC balances from Horizon, prices XLM via CoinGecko, aggregates across multiple Stellar addresses. |
| **AuthModule** | SupabaseAuthGuard | Supabase JWT verification guard + wallet challenge/verify using Stellar SEP-53 signatures. |
| **VascoreModule** | VascoreService | 8-signal credit scoring algorithm from Horizon account data. |

## Data Model

```mermaid
erDiagram
  Commitment {
    string id PK "cuid"
    string stellarUser "email of the user who generated the proof"
    string commitment "0x-prefixed SHA-256 hash"
    int tier "1=Silver 2=Gold 3=Platinum"
    string nonce "uuid without dashes"
    string proofHash "0x-prefixed SHA-256 of proof+verificationKey"
    datetime createdAt
  }
  WalletLink {
    string id PK "cuid"
    string userId "Supabase Auth user ID"
    string email "Google account email"
    string walletAddress "Stellar G... address, @@unique"
    string signature "SEP-53 signed challenge message"
    string status "always 'verified'"
    datetime verifiedAt
    datetime createdAt
  }
  IssuedPassport {
    string id PK "cuid"
    string userEmail "email of passport holder"
    string commitment "matches Commitment.commitment"
    int tier
    datetime verifiedAt "when the snapshot was frozen"
    string proofHash "matches Commitment.proofHash"
    int combinedScore "VAScore 0-100 at time of issuance"
    string scoreLevel "A-F at time of issuance"
    int walletCount "number of linked wallets at time of issuance"
    datetime createdAt
  }
  WalletLink ||--o{ IssuedPassport : "email matches userEmail"
  WalletLink ||--o{ Commitment : "email matches stellarUser"
```

## API Endpoints

### Portfolio

| Method | Route | Auth | Request Body | Response |
|--------|-------|------|-------------|----------|
| POST | `/api/portfolio` | None | `{ "stellarAddresses": ["G..."] }` | `{ "totalValueUsd": number }` |

Logic: For each address, fetches the account from Horizon, sums native XLM balance (priced via CoinGecko, 60s cache) + USDC trustline balance.

### Passport

| Method | Route | Auth | Request Body / Param | Response |
|--------|-------|------|---------------------|----------|
| POST | `/api/passport/prepare` | None | `{ "portfolioValue": number, "tier": number, "userEmail": string }` | `{ commitment, tier, proof, publicInputs, verificationKey, nonce }` |
| GET | `/api/passport/my` | Bearer JWT | — | `{ commitment, tier, verifiedAt, proofHash, walletCount, combinedScore: { scoreNumeric, scoreLevel }, userEmail }` |
| POST | `/api/passport/confirm` | Bearer JWT | `{ "commitment": string }` | `{ id, userEmail, commitment, tier, combinedScore, scoreLevel, walletCount, ... }` |
| GET | `/api/passport/search?q=` | None | query param `q` | Same shape as verify endpoint |
| GET | `/api/passport/verify/:commitmentHash` | None | path param | `{ commitment, tier, proofHash, createdAt, holderEmail, combinedScore, scoreLevel, walletCount, verifiedAt }` |
| GET | `/api/passport/:userEmail` | None | path param | `{ commitment, tier, createdAt }` (minimal) |

### Auth / Wallets

| Method | Route | Auth | Request Body | Response |
|--------|-------|------|-------------|----------|
| GET | `/api/auth/me` | Bearer JWT | — | User object from Supabase |
| POST | `/api/auth/challenge` | None | `{ "address": "G..." }` | `{ challengeId, message }` |
| POST | `/api/auth/wallets/check` | Bearer JWT | `{ "walletAddress": "G..." }` | `{ status: "available" | "linked" | "belongs_to_other" }` |
| POST | `/api/auth/wallets/verify` | Bearer JWT | `{ "walletAddress", "signature", "challengeId" }` | `{ id, walletAddress, email, status }` |
| GET | `/api/auth/wallets` | Bearer JWT | — | `[{ id, walletAddress, status, verifiedAt, email }]` |

### VAScore

| Method | Route | Auth | Request Body | Response |
|--------|-------|------|-------------|----------|
| POST | `/api/vascore` | None | `{ "stellarAddresses": ["G..."] }` | `{ wallets: WalletScoreData[], combined: CombinedScore }` |

## Flows

### Prepare Proof — Detailed

```mermaid
sequenceDiagram
  participant F as Frontend
  participant PAC as PassportController
  participant PAS as PassportService
  participant PRS as ProvingService
  participant DB as SQLite

  F->>PAC: POST /api/passport/prepare {portfolioValue, tier, userEmail}
  PAC->>PAS: prepareProof(portfolioValue, tier, userEmail)
  PAS->>PAS: threshold = getThresholdForTier(tier) // 100000/500000/2500000
  PAS->>PAS: portfolioValue_cents = Math.round(portfolioValue * 100)
  PAS->>PAS: nonce = crypto.randomUUID().replace(/-/g, '')
  PAS->>PRS: generateProof({portfolio_value: portfolioValue_cents, threshold})
  PRS->>PRS: Noir.execute(credit_passport.json, inputs) → witness
  PRS->>PRS: BB.generateProof(witness) → proof + verificationKey
  PRS->>PRS: verify with BB UltraHonkVerifierBackend
  PRS-->>PAS: { proof, publicInputs, verificationKey }
  PAS->>PAS: commitment = sha256(portfolioValue.toString(), nonce)
  PAS->>PAS: proofHash = sha256(proof, verificationKey)
  PAS->>DB: prisma.commitment.create({ stellarUser, commitment, tier, nonce, proofHash })
  DB-->>PAS: Commitment record
  PAS-->>PAC: { commitment, tier, proof, publicInputs, verificationKey, nonce }
  PAC-->>F: JSON response
```

### Confirm Passport — Detailed

```mermaid
sequenceDiagram
  participant F as Frontend
  participant PAC as PassportController
  participant PAS as PassportService
  participant VS as VascoreService
  participant DB as SQLite

  F->>PAC: POST /api/passport/confirm {commitment} (Bearer JWT)
  PAC->>PAC: extract email from JWT via SupabaseAuthGuard
  PAC->>PAS: confirmPassport(commitment, email)
  PAS->>DB: prisma.commitment.findFirst({ commitment, stellarUser: email })
  DB-->>PAS: Commit record (or null → return null)
  PAS->>DB: prisma.walletLink.findMany({ email, status:'verified' })
  DB-->>PAS: WalletLink[]
  PAS->>VS: computeMultiWallet(addresses)
  VS->>VS: for each address: fetch Horizon data → 8 signals → score 0-100 → letter grade
  VS->>VS: combine: max age, sum portfolio, pool transactions
  VS-->>PAS: { combined: { scoreNumeric, scoreLevel, ... } }
  PAS->>DB: prisma.issuedPassport.create({ userEmail, commitment, tier, verifiedAt: now, proofHash, combinedScore, scoreLevel, walletCount })
  DB-->>PAS: IssuedPassport record (frozen snapshot)
  PAS-->>PAC: IssuedPassport
  PAC-->>F: { id, commitment, tier, combinedScore, scoreLevel, walletCount, ... }
```

### Search — Detailed

```mermaid
flowchart TD
  Q["GET /api/passport/search?q="]
  HASH{"q looks like a<br/>commitment hash?<br/>(0x... or 64 hex chars)"}
  TRY_HASH["verifyPassport(query)<br/>→ findFirst Commitment by commitment"]
  FOUND_HASH{"found?"}
  TRY_EMAIL["findFirst IssuedPassport<br/>where userEmail contains query<br/>orderBy createdAt desc"]
  FOUND_EMAIL{"found?"}
  LOOKUP_COMMIT["findFirst Commitment<br/>where commitment = issued.commitment"]
  RETURN["return combined shape<br/>{commitment, tier, proofHash,<br/>createdAt, holderEmail,<br/>combinedScore, scoreLevel,<br/>walletCount, verifiedAt}"]
  NULL["return null"]

  Q --> HASH
  HASH -- yes --> TRY_HASH
  HASH -- no --> TRY_EMAIL
  TRY_HASH --> FOUND_HASH
  FOUND_HASH -- yes --> RETURN
  FOUND_HASH -- no --> TRY_EMAIL
  TRY_EMAIL --> FOUND_EMAIL
  FOUND_EMAIL -- yes --> LOOKUP_COMMIT --> RETURN
  FOUND_EMAIL -- no --> NULL
```

## VAScore Algorithm

```mermaid
flowchart LR
  HA["Horizon Account"]
  HP["Horizon Payments"]
  subgraph Signals
    PV["Portfolio Value<br/>XLM+USDC in USD"]
    AA["Account Age<br/>months since created"]
    TF["Tx Frequency<br/>payments / months"]
    FR["Fail Ratio<br/>(1 - failed/total)"]
    AV["Avg Volume<br/>sent / payments"]
    IO["I/O Ratio<br/>received / sent"]
    TL["Trustlines<br/>count (cap 20)"]
    CO["Consistency<br/>months with ≥1 tx"]
  end
  subgraph Weights
    W1["30%"]
    W2["15%"]
    W3["15%"]
    W4["10%"]
    W5["10%"]
    W6["5%"]
    W7["5%"]
    W8["10%"]
  end
  HA --> PV
  HA --> AA
  HP --> TF
  HP --> FR
  HP --> AV
  HP --> IO
  HA --> TL
  HP --> CO
  PV --> W1
  AA --> W2
  TF --> W3
  FR --> W4
  AV --> W5
  IO --> W6
  TL --> W7
  CO --> W8
  W1 --> SUM["weighted sum (0-100)"]
  W2 --> SUM
  W3 --> SUM
  W4 --> SUM
  W5 --> SUM
  W6 --> SUM
  W7 --> SUM
  W8 --> SUM
  SUM --> GRADE{"letter grade"}
  GRADE --> A["A: 80-100"]
  GRADE --> B["B: 65-79"]
  GRADE --> C["C: 50-64"]
  GRADE --> D["D: 35-49"]
  GRADE --> E["E: 20-34"]
  GRADE --> F["F: 0-19"]
```

Multi-wallet combination: takes the maximum account age across all wallets, sums portfolio values, pools all transactions for frequency/volume/consistency, then scores the pooled data as if it were a single wallet.

## Key Implementation Details

- **Prisma 7 driver adapter**: Uses `@prisma/adapter-libsql` instead of the legacy datasource URL. The `prisma.config.js` file provides the database URL for CLI commands (`db push`, `generate`).
- **Lazy Supabase admin**: `lib/supabase-admin.ts` defers `createClient()` until first call because `SUPABASE_SERVICE_ROLE_KEY` isn't available at module load time (NestJS `ConfigModule` loads during bootstrap).
- **SupabaseAuthGuard**: Gets the Supabase admin client inside `canActivate()` (not at module level) for the same reason. Extracts `req.user.email` from the JWT payload.
- **Route ordering in PassportController**: `search`, `my`, and `verify/:commitmentHash` are declared before `:userEmail` to avoid path parameter matching.
- **Stellar SEP-53 signing**: Wallet verification uses `StellarSdk.StrKey` helpers. The challenge message includes a nonce and expiry. Signature is verified with `verifyMessageSignature`.
- **bb.js initialization**: The ProvingService loads `credit_passport.json` from the filesystem on `onModuleInit`, creates a single `Noir` instance + `UltraHonkBackend` instance, and reuses them across all proof requests.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite database path |
| `STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | Stellar RPC for contract simulation |
| `STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Horizon for balance/tx data |
| `CONTRACT_ID` | — | Deployed Soroban contract address |
| `ADMIN_SECRET_KEY` | — | Stellar admin secret key (for contract deploy) |
| `SUPABASE_URL` | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Supabase admin key (for JWT verification + user lookup) |

## Setup

```bash
npm install
cp .env.example .env   # edit variables
npx prisma db push     # create SQLite database
npx prisma generate    # generate Prisma client
npm run build
npm run start:prod     # or: npm run start:dev
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @aztec/bb.js | 6.0.0-nightly.20260605 | WASM UltraHonk prover (proof + verify) |
| @noir-lang/noir_js | 1.0.0-beta.22 | Circuit witness generation from ACIR bytecode |
| @nestjs/* | 11.x | Framework (core, common, config, platform-express) |
| @prisma/client | 7.8.0 | ORM |
| @prisma/adapter-libsql | latest | SQLite driver adapter for Prisma 7 |
| @stellar/stellar-sdk | 16.0.1 | Contract simulation reads, ScVal parsing |
| @supabase/supabase-js | 2.108.2 | Admin client for JWT verification |
