import { Module } from '@nestjs/common';
import { PassportController } from './passport.controller';
import { PassportService } from './passport.service';
import { VascoreModule } from '../vascore/vascore.module';

@Module({
  controllers: [PassportController],
  providers: [PassportService],
  exports: [PassportService],
  imports: [VascoreModule],
})
export class PassportModule {}
