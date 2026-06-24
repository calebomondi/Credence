const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchStellarPortfolio(stellarAddresses: string[]) {
  if (stellarAddresses.length === 0) return { totalValueUsd: 0 };
  const res = await fetch(`${API_URL}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stellarAddresses }),
  });
  return res.json();
}

export async function preparePassport(portfolioValue: number, tier: number, userEmail: string) {
  const res = await fetch(`${API_URL}/api/passport/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolioValue, tier, userEmail }),
  });
  return res.json();
}

export async function confirmPassport(token: string, commitment: string) {
  const res = await fetch(`${API_URL}/api/passport/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ commitment }),
  });
  if (!res.ok) throw new Error(`Confirm failed: ${res.status}`);
  return res.json();
}

export async function getMyPassport(token: string) {
  const res = await fetch(`${API_URL}/api/passport/my`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getPassport(stellarAddress: string) {
  const res = await fetch(`${API_URL}/api/passport/${stellarAddress}`);
  return res.json();
}

export async function searchPassport(query: string) {
  const res = await fetch(`${API_URL}/api/passport/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function verifyPassport(commitmentHash: string) {
  const res = await fetch(`${API_URL}/api/passport/verify/${commitmentHash}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getChallenge(address: string) {
  const res = await fetch(`${API_URL}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  return res.json();
}

export async function checkWallet(walletAddress: string, token: string) {
  const res = await fetch(`${API_URL}/api/auth/wallets/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) throw new Error(`Check failed: ${res.status}`);
  return res.json();
}

export async function verifyWallet(walletAddress: string, signature: string, challengeId: string, token: string) {
  const res = await fetch(`${API_URL}/api/auth/wallets/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress, signature, challengeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Verification failed');
  }
  return res.json();
}

export async function listWallets(token: string) {
  const res = await fetch(`${API_URL}/api/auth/wallets`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchVAScore(stellarAddresses: string[]) {
  if (stellarAddresses.length === 0) return { wallets: [], combined: { scoreNumeric: 0, scoreLevel: 'F', portfolioValue: 0, accountAgeMonths: 0, txFrequencyPerMonth: 0, trustlineCount: 0 } };
  const res = await fetch(`${API_URL}/api/vascore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stellarAddresses }),
  });
  return res.json();
}
