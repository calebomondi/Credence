import { Module } from '@nestjs/common';
import { VascoreController } from './vascore.controller';
import { VascoreService } from './vascore.service';

@Module({
  controllers: [VascoreController],
  providers: [VascoreService],
  exports: [VascoreService],
})
export class VascoreModule {}
