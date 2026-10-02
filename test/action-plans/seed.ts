import { DataSource } from 'typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../src/database/entities/action-plans.entity';
import UsersEntity from '../../src/database/entities/users.entity';
import { defaultPasswordHash, seedExistentUser } from '../users/seed';

export const seedActionPlans = async (
  dataSource: DataSource,
  userId: string,
) => {
  const actionPlansRepository = dataSource.getRepository(ActionPlansEntity);

  const mockActionPlan = new ActionPlansEntity();
  mockActionPlan.userId = userId;
  mockActionPlan.title = 'Seeded Action Plan';
  mockActionPlan.specificGoal = 'Deploy a cluster in production';
  mockActionPlan.deadline = new Date('2025-12-31');
  mockActionPlan.resources = 'Courses and documentation';
  mockActionPlan.successIndicator = 'Weekly labs';
  mockActionPlan.rewards = 'Weekend trip';
  mockActionPlan.status = ActionPlanStatusEnum.NOT_STARTED;

  return actionPlansRepository.save(mockActionPlan);
};

export const seedActionPlansModule = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UsersEntity);
  const { existentUser } = await seedExistentUser(dataSource);

  const userWithoutActionPlans = new UsersEntity();
  userWithoutActionPlans.email = 'user-without-plans@email.com';
  userWithoutActionPlans.passwordHash = defaultPasswordHash;

  const userForCreation = new UsersEntity();
  userForCreation.email = 'user-for-creation@email.com';
  userForCreation.passwordHash = defaultPasswordHash;

  const [savedUserWithoutActionPlans, savedUserForCreation] =
    await userRepository.save([userWithoutActionPlans, userForCreation]);

  const seededActionPlan = await seedActionPlans(dataSource, existentUser.id);

  return {
    userWithActionPlans: existentUser,
    userWithoutActionPlans: savedUserWithoutActionPlans,
    userForCreation: savedUserForCreation,
    seededActionPlan,
  };
};
