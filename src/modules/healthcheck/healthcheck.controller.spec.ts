import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthcheckController } from './healthcheck.controller';

describe('HealthcheckController', () => {
  let controller: HealthcheckController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let typeOrmHealthIndicator: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn().mockResolvedValue({ status: 'ok', details: {} }),
    } as unknown as jest.Mocked<HealthCheckService>;

    typeOrmHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    } as unknown as jest.Mocked<TypeOrmHealthIndicator>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthcheckController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: typeOrmHealthIndicator },
      ],
    }).compile();

    controller = module.get<HealthcheckController>(HealthcheckController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return liveness status', async () => {
    await controller.liveness();

    expect(healthCheckService.check).toHaveBeenCalledWith([]);
  });

  it('should return readiness status with database check', async () => {
    await controller.readiness();

    expect(healthCheckService.check).toHaveBeenCalledWith([
      expect.any(Function),
    ]);
  });

  it('should alias root healthcheck to liveness', async () => {
    await controller.check();

    expect(healthCheckService.check).toHaveBeenCalledWith([]);
  });
});
