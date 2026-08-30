import { DataSource } from 'typeorm';
import { seedActionPlans, seedActionPlansModule } from '../action-plans/seed';

export const seedTasksModule = async (dataSource: DataSource) => {
  const { userWithoutActionPlans, seededActionPlan, userWithActionPlans } =
    await seedActionPlansModule(dataSource);

  const actionPlanWithoutTasks = await seedActionPlans(
    dataSource,
    userWithoutActionPlans.id,
  );

  return {
    userWithActionPlans,
    actionPlanForTasks: seededActionPlan,
    actionPlanWithoutTasks,
  };
};
