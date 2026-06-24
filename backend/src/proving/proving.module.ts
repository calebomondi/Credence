import { Module, Global } from '@nestjs/common';
import { ProvingService } from './proving.service';

@Global()
@Module({
  providers: [ProvingService],
  exports: [ProvingService],
})
export class ProvingModule {}
