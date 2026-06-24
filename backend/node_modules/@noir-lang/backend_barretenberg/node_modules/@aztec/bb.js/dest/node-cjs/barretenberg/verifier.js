"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarretenbergVerifier = void 0;
const index_js_1 = require("./index.js");
const raw_buffer_js_1 = require("../types/raw_buffer.js");
// TODO: once UP is removed we can just roll this into the bas `Barretenberg` class.
class BarretenbergVerifier {
    constructor(options = { threads: 1 }) {
        this.options = options;
    }
    /** @ignore */
    async instantiate() {
        if (!this.api) {
            if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
                this.options.threads = navigator.hardwareConcurrency;
            }
            else {
                try {
                    const os = await Promise.resolve().then(() => __importStar(require('os')));
                    this.options.threads = os.cpus().length;
                }
                catch (e) {
                    console.log('Could not detect environment. Falling back to one thread.', e);
                }
            }
            const api = await index_js_1.Barretenberg.new(this.options);
            await api.initSRSForCircuitSize(0);
            this.acirComposer = await api.acirNewAcirComposer(0);
            this.api = api;
        }
    }
    /** @description Verifies a proof */
    async verifyUltraplonkProof(proof, verificationKey) {
        await this.instantiate();
        // The verifier can be used for a variety of ACIR programs so we should not assume that it
        // is preloaded with the correct verification key.
        await this.api.acirLoadVerificationKey(this.acirComposer, new raw_buffer_js_1.RawBuffer(verificationKey));
        return await this.api.acirVerifyProof(this.acirComposer, proof);
    }
    /** @description Verifies a proof */
    async verifyUltrahonkProof(proof, verificationKey) {
        await this.instantiate();
        return await this.api.acirVerifyUltraHonk(proof, new raw_buffer_js_1.RawBuffer(verificationKey));
    }
    async destroy() {
        if (!this.api) {
            return;
        }
        await this.api.destroy();
    }
}
exports.BarretenbergVerifier = BarretenbergVerifier;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZpZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnL3ZlcmlmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseUNBQTBEO0FBQzFELDBEQUFtRDtBQUVuRCxvRkFBb0Y7QUFFcEYsTUFBYSxvQkFBb0I7SUFVL0IsWUFBb0IsVUFBMEIsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFO1FBQXhDLFlBQU8sR0FBUCxPQUFPLENBQWlDO0lBQUcsQ0FBQztJQUVoRSxjQUFjO0lBQ2QsS0FBSyxDQUFDLFdBQVc7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztZQUN2RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDO29CQUNILE1BQU0sRUFBRSxHQUFHLHdEQUFhLElBQUksR0FBQyxDQUFDO29CQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUMxQyxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyREFBMkQsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUUsQ0FBQztZQUNILENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxNQUFNLHVCQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRCxNQUFNLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLENBQUM7SUFDSCxDQUFDO0lBRUQsb0NBQW9DO0lBQ3BDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxLQUFpQixFQUFFLGVBQTJCO1FBQ3hFLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pCLDBGQUEwRjtRQUMxRixrREFBa0Q7UUFDbEQsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSx5QkFBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFFMUYsT0FBTyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELG9DQUFvQztJQUNwQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsS0FBaUIsRUFBRSxlQUEyQjtRQUN2RSxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUV6QixPQUFPLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSx5QkFBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPO1FBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNkLE9BQU87UUFDVCxDQUFDO1FBQ0QsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRjtBQXpERCxvREF5REMifQ==