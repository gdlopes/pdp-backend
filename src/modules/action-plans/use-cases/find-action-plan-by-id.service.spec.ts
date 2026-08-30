import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity from '../../../database/entities/action-plans.entity';
import { FindActionPlanByIdService } from './find-action-plan-by-id.service';

const actionPlansRepositoryMock = {
  findOne: jest.fn(),
};

describe('FindActionPlanByIdService', () => {
  let service: FindActionPlanByIdService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindActionPlanByIdService,
        {
          provide: getRepositoryToken(ActionPlansEntity),
          useValue: actionPlansRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<FindActionPlanByIdService>(FindActionPlanByIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-action-plan-id';

    it('should return the action plan when found', async () => {
      const fakeActionPlan = {
        id: fakeId,
        title: 'Fake Action Plan',
      } as ActionPlansEntity;

      jest
        .spyOn(actionPlansRepositoryMock, 'findOne')
        .mockResolvedValueOnce(fakeActionPlan);

      const result = await service.execute(fakeId);

      expect(result).toEqual(fakeActionPlan);
      expect(actionPlansRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: fakeId },
      });
    });

    it('should throw BadRequestException when action plan does not exist', async () => {
      jest
        .spyOn(actionPlansRepositoryMock, 'findOne')
        .mockResolvedValueOnce(null);

      await expect(service.execute(fakeId)).rejects.toThrow(
        'Action plan does not exists.',
      );
    });
  });
});
