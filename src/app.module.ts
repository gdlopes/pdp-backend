import { Module } from '@nestjs/common';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ActionPlansModule } from './action-plans/action-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthcheckModule,
    DatabaseModule,
    UsersModule,
    ActionPlansModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
