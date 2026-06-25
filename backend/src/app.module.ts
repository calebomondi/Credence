import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PassportModule } from './passport/passport.module';
import { ProvingModule } from './proving/proving.module';
import { AuthModule } from './auth/auth.module';
import { VascoreModule } from './vascore/vascore.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PortfolioModule,
    PassportModule,
    ProvingModule,
    AuthModule,
    VascoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
