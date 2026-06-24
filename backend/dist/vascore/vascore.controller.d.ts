import { VascoreService } from './vascore.service';
import type { VAScoreResponse } from './vascore.types';
export declare class VascoreController {
    private readonly vascoreService;
    constructor(vascoreService: VascoreService);
    getScores(body: {
        stellarAddresses: string[];
    }): Promise<VAScoreResponse>;
}
