import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const createUserDto: CreateUserDto = {
    email: 'test@email.com',
    password: '123456',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(createUserDto),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
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
    expect(service.create).toHaveBeenCalled();
  });
});
