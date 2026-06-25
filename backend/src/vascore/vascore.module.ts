import { Module } from '@nestjs/common';
import { VascoreController } from './vascore.controller';
import { VascoreService } from './vascore.service';
import { PriceModule } from '../price/price.module';

@Module({
  imports: [PriceModule],
  controllers: [VascoreController],
  providers: [VascoreService],
  exports: [VascoreService],
})
export class VascoreModule {}
