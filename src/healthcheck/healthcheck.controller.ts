import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';

@Controller('healthcheck')
export class HealthcheckController {
  @Get()
  check() {
    return { health: 'ok' }
  }
}
