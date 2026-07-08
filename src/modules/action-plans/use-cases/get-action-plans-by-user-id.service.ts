import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity from '../../../database/entities/action-plans.entity';
import { GetUserByIdService } from '../../../modules/users/use-cases/get-user-by-id.service';

@Injectable()
export class GetActionPlansByUserIdService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    @Inject(GetUserByIdService)
    private getUserByIdService: GetUserByIdService,
  ) {}

  public async execute(userId: string): Promise<ActionPlansEntity[]> {
    await this.getUserByIdService.execute(userId);

    return this.actionPlansRepository.findBy({ userId });
  }
}
