import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import {
  CreateUserService,
  GetUserByEmailService,
  GetUserByIdService,
} from './use-cases';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let createUserService: CreateUserService;
  let getUserByEmailService: GetUserByEmailService;
  let getUserByIdService: GetUserByIdService;

  const createUserDto: CreateUserDto = {
    email: 'test@email.com',
    password: '123456',
  };

  const fakeUser = {
    id: 'user-123',
    email: 'test@email.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CreateUserService,
          useValue: {
            execute: jest.fn().mockResolvedValue(createUserDto),
          },
        },
        {
          provide: GetUserByEmailService,
          useValue: {
            execute: jest.fn().mockResolvedValue(fakeUser),
          },
        },
        {
          provide: GetUserByIdService,
          useValue: {
            execute: jest.fn().mockResolvedValue(fakeUser),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    createUserService = module.get<CreateUserService>(CreateUserService);
    getUserByEmailService = module.get<GetUserByEmailService>(
      GetUserByEmailService,
    );
    getUserByIdService = module.get<GetUserByIdService>(GetUserByIdService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST users create', async () => {
    const requestBody = {
      email: 'test@email.com',
      password: '12345',
    };

    const response = await controller.create(requestBody);

    expect(response.email).toEqual(requestBody.email);
    expect(createUserService.execute).toHaveBeenCalled();
  });

  it('GET users findByEmail', async () => {
    const email = 'test@email.com';

    const response = await controller.findByEmail(email);

    expect(response).toEqual(fakeUser);
    expect(getUserByEmailService.execute).toHaveBeenCalledWith(email);
  });

  it('GET users findById', async () => {
    const id = 'user-123';

    const response = await controller.findById(id);

    expect(response).toEqual(fakeUser);
    expect(getUserByIdService.execute).toHaveBeenCalledWith(id);
  });
});
