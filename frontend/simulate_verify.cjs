const StellarSdk = require('@stellar/stellar-sdk');

const rpcUrl = 'https://soroban-testnet.stellar.org';
const contractId = 'CBRFQ6BBNJNC6HF33MG6KT5AFWXQ6EPICZOMIPQR7EAQGESNKNRHC37X';
const networkPassphrase = StellarSdk.Networks.TESTNET;
const rpc = new StellarSdk.rpc.Server(rpcUrl);

// Generate a random keypair for simulation (doesn't need to exist for simulation,
// but the contract call will need user auth — simulation shows if verify_groth16 works)
const kp = StellarSdk.Keypair.random();
const userAddr = kp.publicKey();

const proof = {
  a: '1193ccc93146ae46da2326f281395cc6962c292ae244241a555c1382fee1a6c32ebb63c1d05d2d81441515ae1bda4b450ca628bef403c7bb713cc2a6e7b10786a2113f330ab46e1130076ad6bb4f4d0368372fb8b7feee22ef2c94df3dc89e85',
  b: '102c67e768625501706a9bc2bc01b0eb1cb20e9cc2f964d9391ca7733c9b261e07ff6a0a69c0a9dadd86d13a1c8658be0cdbd4d21c4a114dcdd93ffe2f217b6a0e3547895f23adae37998eec4346f0e5056ae72f599483d80e6402ee7db6bcc410ac6f58cbcf05dd5377458905e3b57b0eb66fbb34d1f6a5ade8ba8e62ef83c046011df815ddec64bda748eb30c7188917f61139b383033be671a837b67db8f19e3d4ba5140b6fbb32fb4da854090c8e35793f5278d913d9b5e1e06d7750a4d2',
  c: '11361446269daeaba192068ad96ff826d1523a0cdacba2454d75ddba927c80f5dd801325ae019daf570dab63fa9010f1168d179af4ce193497b2e74322b1b768f10dfbc9aa82991ec79d80263096af2aaf14b6f2ab5f8178f5dca9172972ac05',
};
const publicSignals = ['00000000000000000000000000000000000000000000000000000000000186a0', '0000000000000000000000000000000000000000000000000000000000000000'];
const commitment = '0x8ce1d8e4d18b86348f0f233cd56bd45c68eae981ddbdfe52a33bf849a1608a6f';
const vascore = 0;
const walletCount = 1;
const tier = 1;
const portfolioValue = 200000;

function hexToBuffer(hex) {
  return Buffer.from(hex.replace('0x', ''), 'hex');
}

(async () => {
  try {
    // Use a random source account that doesn't need to exist for simulation
    const source = new StellarSdk.Account(userAddr, '0');

    const userScVal = StellarSdk.Address.fromString(userAddr).toScVal();
    const portfolioValueScVal = StellarSdk.nativeToScVal(BigInt(Math.round(portfolioValue * 100)), { type: 'u128' });

    const proofScVal = StellarSdk.xdr.ScVal.scvMap([
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol('a'),
        val: StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(proof.a)),
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol('b'),
        val: StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(proof.b)),
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol('c'),
        val: StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(proof.c)),
      }),
    ]);

    const publicSignalsScVal = StellarSdk.xdr.ScVal.scvVec(
      publicSignals.map(hex => StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(hex))),
    );

    const commitmentScVal = StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(commitment));
    const tierScVal = StellarSdk.nativeToScVal(tier, { type: 'u32' });
    const vascoreScVal = StellarSdk.nativeToScVal(vascore, { type: 'u32' });
    const walletCountScVal = StellarSdk.nativeToScVal(walletCount, { type: 'u32' });

    const contract = new StellarSdk.Contract(contractId);
    let tx = new StellarSdk.TransactionBuilder(source, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'verify_and_issue',
          userScVal,
          proofScVal,
          publicSignalsScVal,
          portfolioValueScVal,
          commitmentScVal,
          tierScVal,
          vascoreScVal,
          walletCountScVal,
        ),
      )
      .setTimeout(180)
      .build();

    const simulation = await rpc.simulateTransaction(tx);
    
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      console.log('❌ SIMULATION ERROR');
      console.log('Error:', simulation.error);
      console.log('Events:', JSON.stringify(simulation.events, null, 2));
    } else if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
      console.log('✅ SIMULATION SUCCESS');
      const result = StellarSdk.rpc.Api.getCost(simulation);
      console.log('Cost:', JSON.stringify(result, null, 2));
      if (simulation.result) {
        console.log('Result:', simulation.result.retval);
      }
    }
  } catch (e) {
    console.error('Exception:', e);
  }
  process.exit(0);
})();
