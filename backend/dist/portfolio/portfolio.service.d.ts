export declare class PortfolioService {
    private horizonUrl;
    private fetchXlmPrice;
    private lookupBalance;
    aggregate(stellarAddresses: string[]): Promise<number>;
}
