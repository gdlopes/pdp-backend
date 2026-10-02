import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SimplifyActionPlansColumns1789200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('action_plans', 'goal');
    await queryRunner.dropColumn('action_plans', 'alignment_with_life_career');
    await queryRunner.dropColumn('action_plans', 'motivation');
    await queryRunner.dropColumn('action_plans', 'current_level');
    await queryRunner.dropColumn('action_plans', 'expected_level');
    await queryRunner.dropColumn('action_plans', 'development_impact');
    await queryRunner.dropColumn('action_plans', 'learning_method');
    await queryRunner.dropColumn('action_plans', 'time_commitment');
    await queryRunner.dropColumn('action_plans', 'knowledge_application');
    await queryRunner.dropColumn('action_plans', 'review_commitment');

    await queryRunner.renameColumn(
      'action_plans',
      'estimated_completion_date',
      'deadline',
    );
    await queryRunner.renameColumn(
      'action_plans',
      'progress_tracking_method',
      'success_indicator',
    );

    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        isNullable: false,
        default: `'NOT_STARTED'`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('action_plans', 'status');

    await queryRunner.renameColumn(
      'action_plans',
      'deadline',
      'estimated_completion_date',
    );
    await queryRunner.renameColumn(
      'action_plans',
      'success_indicator',
      'progress_tracking_method',
    );

    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'goal',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'alignment_with_life_career',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'motivation',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'current_level',
        type: 'varchar',
        isNullable: false,
        default: `'BEGINNER'`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'expected_level',
        type: 'varchar',
        isNullable: false,
        default: `'ENHANCE_CURRENT_LEVEL'`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'development_impact',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'learning_method',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'time_commitment',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'knowledge_application',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }),
    );
    await queryRunner.addColumn(
      'action_plans',
      new TableColumn({
        name: 'review_commitment',
        type: 'varchar',
        isNullable: false,
        default: `'WEEKLY'`,
      }),
    );
  }
}
