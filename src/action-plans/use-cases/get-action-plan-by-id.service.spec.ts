import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity from '../../database/entities/action-plans.entity';
import { UsersService } from '../../users/users.service';
import { GetActionPlanByIdService } from './get-action-plan-by-id.service';

const actionPlansRepositoryMock = {
  findOneBy: jest.fn(),
};

const usersServiceMock = {
  validateUserExists: jest.fn(),
};

describe('GetActionPlanByIdService', () => {
  let service: GetActionPlanByIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActionPlanByIdService,
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

    service = module.get<GetActionPlanByIdService>(GetActionPlanByIdService);

    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeUserId = 'fake-user-id';
    const fakeId = 'fake-action-plan-id';

    const fakeActionPlan = {
      id: fakeId,
      userId: fakeUserId,
      title: 'Fake Action Plan',
    } as ActionPlansEntity;

    it('should return the action plan when found', async () => {
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockResolvedValueOnce({ id: fakeUserId });
      jest
        .spyOn(actionPlansRepositoryMock, 'findOneBy')
        .mockResolvedValueOnce(fakeActionPlan);

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual(fakeActionPlan);
      expect(usersServiceMock.validateUserExists).toHaveBeenCalledWith(
        fakeUserId,
      );
      expect(actionPlansRepositoryMock.findOneBy).toHaveBeenCalledWith({
        id: fakeId,
        userId: fakeUserId,
      });
    });

    it('should throw NotFoundException when action plan does not exist', async () => {
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockResolvedValueOnce({ id: fakeUserId });
      jest
        .spyOn(actionPlansRepositoryMock, 'findOneBy')
        .mockResolvedValueOnce(null);

      await expect(service.execute(fakeUserId, fakeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when action plan belongs to a different user', async () => {
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockResolvedValueOnce({ id: fakeUserId });
      jest
        .spyOn(actionPlansRepositoryMock, 'findOneBy')
        .mockResolvedValueOnce(null);

      await expect(service.execute('another-user-id', fakeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when user does not exist', async () => {
      const findOneBySpy = jest.spyOn(actionPlansRepositoryMock, 'findOneBy');
      jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockRejectedValueOnce(
          new BadRequestException('User does not exists.'),
        );

      await expect(service.execute(fakeUserId, fakeId)).rejects.toThrow(
        'User does not exists.',
      );
      expect(findOneBySpy).not.toHaveBeenCalled();
    });
  });
});
