import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlansController } from './action-plans.controller';
import { ActionPlansService } from './action-plans.service';

describe('ActionPlansController', () => {
  let controller: ActionPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionPlansController],
      providers: [ActionPlansService],
    }).compile();

    controller = module.get<ActionPlansController>(ActionPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
