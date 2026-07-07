import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UsersEntity from '../../../database/entities/users.entity';
import { GetUserByIdService } from './get-user-by-id.service';

const usersRepositoryMock = {
  findOne: jest.fn(),
};

describe('GetUserByIdService', () => {
  let service: GetUserByIdService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserByIdService,
        {
          provide: getRepositoryToken(UsersEntity),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<GetUserByIdService>(GetUserByIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'some-id';

    it('should return the user when found by id', async () => {
      const fakeUser = {
        id: fakeId,
        email: 'fake@email.com',
      } as UsersEntity;

      jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValueOnce(fakeUser);

      const result = await service.execute(fakeId);

      expect(result).toEqual(fakeUser);
      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: fakeId },
      });
    });

    it('should throw BadRequestException when user does not exist', async () => {
      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValueOnce(null);

      const promise = service.execute(fakeId);

      await expect(promise).rejects.toThrow('User does not exists.');
    });
  });
});
