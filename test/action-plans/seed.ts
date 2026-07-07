import { DataSource } from 'typeorm';
import ActionPlansEntity from '../../src/database/entities/action-plans.entity';
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
  mockActionPlan.goal = 'Improve Kubernetes knowledge';
  mockActionPlan.alignmentWithLifeCareer = 'Career growth';
  mockActionPlan.motivation = 'New project at work';
  mockActionPlan.currentLevel = 'BEGINNER';
  mockActionPlan.expectedLevel = 'ENHANCE_CURRENT_LEVEL';
  mockActionPlan.specificGoal = 'Deploy a cluster in production';
  mockActionPlan.progressTrackingMethod = 'Weekly labs';
  mockActionPlan.resources = 'Courses and documentation';
  mockActionPlan.developmentImpact = 'Lead cloud-native projects';
  mockActionPlan.estimatedCompletionDate = new Date('2025-12-31');
  mockActionPlan.learningMethod = 'Hands-on practice';
  mockActionPlan.timeCommitment = 3;
  mockActionPlan.knowledgeApplication = 'Apply in current project';
  mockActionPlan.rewards = 'Weekend trip';
  mockActionPlan.reviewCommitment = 'WEEKLY';

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
