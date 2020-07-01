import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export default class AddCategoryIdToTransactions1593535130833
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'category_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['category_id'], // Nome na tabela de transactions
        referencedColumnNames: ['id'], // Nome na tabela de Category
        referencedTableName: 'categories',
        name: 'TransactionCategory', // Nome da Chave estrangeira
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('transactions', 'TransactionCategory'); // Drop a ForeingKey Para o nome da tabela e no nome da ForeingKey
    await queryRunner.dropColumn('transactions', 'category_id'); // Drop Columa, passa o nome da  Tabela e o nome e o category_ID que fica na table transctions
  }
}
