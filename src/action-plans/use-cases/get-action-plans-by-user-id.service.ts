import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity from '../../database/entities/action-plans.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GetActionPlansByUserIdService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    @Inject(UsersService)
    private userService: UsersService,
  ) {}

  public async execute(userId: string): Promise<ActionPlansEntity[]> {
    await this.userService.validateUserExists(userId);

    return this.actionPlansRepository.findBy({ userId });
  }
}
