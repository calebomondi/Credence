export interface WalletScoreData {
  address: string;
  portfolioValue: number;
  accountAgeMonths: number;
  txFrequencyPerMonth: number;
  failedTxRatio: number;
  avgPaymentVolumeUsd: number;
  ioRatio: number;
  trustlineCount: number;
  consistencyPct: number;
  scoreNumeric: number;
  scoreLevel: ScoreLevel;
}

export type ScoreLevel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface CombinedScore {
  scoreNumeric: number;
  scoreLevel: ScoreLevel;
  portfolioValue: number;
  accountAgeMonths: number;
  txFrequencyPerMonth: number;
  trustlineCount: number;
}

export interface VAScoreResponse {
  wallets: WalletScoreData[];
  combined: CombinedScore;
}
