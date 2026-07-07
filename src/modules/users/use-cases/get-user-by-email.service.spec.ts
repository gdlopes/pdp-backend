import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UsersEntity from '../../../database/entities/users.entity';
import { GetUserByEmailService } from './get-user-by-email.service';

const usersRepositoryMock = {
  findOne: jest.fn(),
};

describe('GetUserByEmailService', () => {
  let service: GetUserByEmailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserByEmailService,
        {
          provide: getRepositoryToken(UsersEntity),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<GetUserByEmailService>(GetUserByEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeEmail = 'fake@email.com';

    it('should return the user when found by email', async () => {
      const fakeUser = {
        id: 'some-id',
        email: fakeEmail,
      } as UsersEntity;

      jest
        .spyOn(usersRepositoryMock, 'findOne')
        .mockResolvedValueOnce(fakeUser);

      const result = await service.execute(fakeEmail);

      expect(result).toEqual(fakeUser);
      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: fakeEmail },
      });
    });

    it('should throw BadRequestException when user does not exist', async () => {
      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValueOnce(null);

      const promise = service.execute(fakeEmail);

      await expect(promise).rejects.toThrow('User does not exists.');
    });
  });
});
