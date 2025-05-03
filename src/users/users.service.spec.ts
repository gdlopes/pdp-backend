import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import UsersEntity from '../database/entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';

const usersRepositoryMock = {
  save: jest.fn(),
  findOne: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UsersEntity),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#create', () => {
    it('should create users successfully', async () => {
      const fakeCreateUserData: CreateUserDto = {
        email: 'fake@email.com',
        password: 'fake-password',
      };
      jest.spyOn(usersRepositoryMock, 'save').mockResolvedValueOnce({
        id: 'some-id',
        email: fakeCreateUserData.email,
      });

      const result = await service.create(fakeCreateUserData);

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

      const promise = service.create(fakeExistentUserData);

      await expect(promise).rejects.toThrow('User already exists.');
    });
  });
});
