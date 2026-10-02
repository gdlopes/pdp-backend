import { BadRequestException } from '@nestjs/common';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import { AssertActionPlanWritableService } from './assert-action-plan-writable.service';

describe('AssertActionPlanWritableService', () => {
  const service = new AssertActionPlanWritableService();

  it('allows NOT_STARTED and IN_PROGRESS', () => {
    expect(() =>
      service.execute({ status: ActionPlanStatusEnum.NOT_STARTED }),
    ).not.toThrow();
    expect(() =>
      service.execute({ status: ActionPlanStatusEnum.IN_PROGRESS }),
    ).not.toThrow();
  });

  it('rejects a completed plan', () => {
    expect(() =>
      service.execute({ status: ActionPlanStatusEnum.COMPLETED }),
    ).toThrow(new BadRequestException('Action plan is completed.'));
  });

  it('rejects an archived plan', () => {
    expect(() =>
      service.execute({ status: ActionPlanStatusEnum.ARCHIVED }),
    ).toThrow(new BadRequestException('Action plan is archived.'));
  });
});
