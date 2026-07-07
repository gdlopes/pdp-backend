import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ActionPlansModule } from './modules/action-plans/action-plans.module';
import { HealthcheckModule } from './modules/healthcheck/healthcheck.module';
import { UsersModule } from './modules/users/users.module';

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
