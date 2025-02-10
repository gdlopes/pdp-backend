import { Module } from '@nestjs/common';
import { HealthcheckModule } from './healthcheck/healthcheck.module';

@Module({
  imports: [HealthcheckModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
