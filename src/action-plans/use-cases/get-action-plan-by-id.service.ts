import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity from '../../database/entities/action-plans.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GetActionPlanByIdService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    @Inject(UsersService)
    private userService: UsersService,
  ) {}

  public async execute(userId: string, id: string): Promise<ActionPlansEntity> {
    await this.userService.validateUserExists(userId);

    const actionPlan = await this.actionPlansRepository.findOneBy({
      id,
      userId,
    });

    if (!actionPlan) {
      throw new NotFoundException(`Action plan not found for user ${userId}.`);
    }

    return actionPlan;
  }
}
