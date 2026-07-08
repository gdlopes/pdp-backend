import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UsersEntity from '../../../database/entities/users.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserService } from './create-user.service';

const usersRepositoryMock = {
  save: jest.fn(),
  findOne: jest.fn(),
};

describe('CreateUserService', () => {
  let service: CreateUserService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserService,
        {
          provide: getRepositoryToken(UsersEntity),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CreateUserService>(CreateUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    it('should create users successfully', async () => {
      const fakeCreateUserData: CreateUserDto = {
        email: 'fake@email.com',
        password: 'fake-password',
      };
      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(usersRepositoryMock, 'save').mockResolvedValueOnce({
        id: 'some-id',
        email: fakeCreateUserData.email,
      });

      const result = await service.execute(fakeCreateUserData);

      expect(result.id).toBeDefined();
      expect(result.email).toEqual(fakeCreateUserData.email);
    });

    it('should return conflict error when email already exists', async () => {
      const fakeExistentUserData: CreateUserDto = {
        email: 'existent-user@email.com',
        password: 'fake-password',
      };
      jest.spyOn(usersRepositoryMock, 'findOne').mockResolvedValueOnce({
        id: 'some-id',
        email: fakeExistentUserData.email,
      });

      const promise = service.execute(fakeExistentUserData);

      await expect(promise).rejects.toThrow('User already exists.');
    });
  });
});
