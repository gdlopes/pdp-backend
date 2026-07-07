import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserService } from './use-cases';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let service: CreateUserService;

  const createUserDto: CreateUserDto = {
    email: 'test@email.com',
    password: '123456',
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
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<CreateUserService>(CreateUserService);
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
    expect(service.execute).toHaveBeenCalled();
  });
});
