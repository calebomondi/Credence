import { Barretenberg } from './index.js';
import { RawBuffer } from '../types/raw_buffer.js';
// TODO: once UP is removed we can just roll this into the bas `Barretenberg` class.
export class BarretenbergVerifier {
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
                    const os = await import('os');
                    this.options.threads = os.cpus().length;
                }
                catch (e) {
                    console.log('Could not detect environment. Falling back to one thread.', e);
                }
            }
            const api = await Barretenberg.new(this.options);
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
        await this.api.acirLoadVerificationKey(this.acirComposer, new RawBuffer(verificationKey));
        return await this.api.acirVerifyProof(this.acirComposer, proof);
    }
    /** @description Verifies a proof */
    async verifyUltrahonkProof(proof, verificationKey) {
        await this.instantiate();
        return await this.api.acirVerifyUltraHonk(proof, new RawBuffer(verificationKey));
    }
    async destroy() {
        if (!this.api) {
            return;
        }
        await this.api.destroy();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZpZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnL3ZlcmlmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBa0IsWUFBWSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQzFELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUVuRCxvRkFBb0Y7QUFFcEYsTUFBTSxPQUFPLG9CQUFvQjtJQVUvQixZQUFvQixVQUEwQixFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7UUFBeEMsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7SUFBRyxDQUFDO0lBRWhFLGNBQWM7SUFDZCxLQUFLLENBQUMsV0FBVztRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDZCxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1lBQ3ZELENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUM7b0JBQ0gsTUFBTSxFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQzFDLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLDJEQUEyRCxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakQsTUFBTSxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkMsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNqQixDQUFDO0lBQ0gsQ0FBQztJQUVELG9DQUFvQztJQUNwQyxLQUFLLENBQUMscUJBQXFCLENBQUMsS0FBaUIsRUFBRSxlQUEyQjtRQUN4RSxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6QiwwRkFBMEY7UUFDMUYsa0RBQWtEO1FBQ2xELE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFFMUYsT0FBTyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELG9DQUFvQztJQUNwQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsS0FBaUIsRUFBRSxlQUEyQjtRQUN2RSxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUV6QixPQUFPLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU87UUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2QsT0FBTztRQUNULENBQUM7UUFDRCxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDM0IsQ0FBQztDQUNGIn0=