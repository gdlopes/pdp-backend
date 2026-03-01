import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity from '../../database/entities/action-plans.entity';
import { UsersService } from '../../users/users.service';
import { GetActionPlansByUserIdService } from './get-action-plans-by-user-id.service';

const actionPlansRepositoryMock = {
  findBy: jest.fn(),
};

const usersServiceMock = {
  validateUserExists: jest.fn(),
};

describe('GetActionPlansByUserIdService', () => {
  let service: GetActionPlansByUserIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActionPlansByUserIdService,
        {
          provide: getRepositoryToken(ActionPlansEntity),
          useValue: actionPlansRepositoryMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = module.get<GetActionPlansByUserIdService>(
      GetActionPlansByUserIdService,
    );

    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeUserId = 'fake-user-id';

    const fakeActionPlans = [
      { id: 'plan-1', userId: fakeUserId, title: 'Plano 1' },
      { id: 'plan-2', userId: fakeUserId, title: 'Plano 2' },
    ] as ActionPlansEntity[];

    it('should return action plans for a given user', async () => {
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockResolvedValueOnce({ id: fakeUserId });
      jest
        .spyOn(actionPlansRepositoryMock, 'findBy')
        .mockResolvedValueOnce(fakeActionPlans);

      const result = await service.execute(fakeUserId);

      expect(result).toEqual(fakeActionPlans);
      expect(usersServiceMock.validateUserExists).toHaveBeenCalledWith(
        fakeUserId,
      );
      expect(actionPlansRepositoryMock.findBy).toHaveBeenCalledWith({
        userId: fakeUserId,
      });
    });

    it('should return an empty array when user has no action plans', async () => {
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockResolvedValueOnce({ id: fakeUserId });
      jest.spyOn(actionPlansRepositoryMock, 'findBy').mockResolvedValueOnce([]);

      const result = await service.execute(fakeUserId);

      expect(result).toEqual([]);
    });

    it('should throw when user does not exist', async () => {
      const findBySpy = jest.spyOn(actionPlansRepositoryMock, 'findBy');
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockRejectedValueOnce(
          new BadRequestException('User does not exists.'),
        );

      await expect(service.execute(fakeUserId)).rejects.toThrow(
        'User does not exists.',
      );
      expect(findBySpy).not.toHaveBeenCalled();
    });
  });
});
