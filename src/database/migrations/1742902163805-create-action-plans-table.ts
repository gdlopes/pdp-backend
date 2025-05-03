import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateActionPlansTable1742902163805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'action_plans',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'varchar',
            isUnique: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'goal',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'alignment_with_life_career',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'motivation',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'current_level',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'expected_level',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'specific_goal',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'progress_tracking_method',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'resources',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'development_impact',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'estimated_completion_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'learning_method',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'time_commitment',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'knowledge_application',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'rewards',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'action_plans',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('action_plans');
    const foreignKey =
      table &&
      table.foreignKeys.find((fk) => fk.columnNames.indexOf('user_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('action_plans', foreignKey);
    }
    await queryRunner.dropTable('action_plans');
  }
}
