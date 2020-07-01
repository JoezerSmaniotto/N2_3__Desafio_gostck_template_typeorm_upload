import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category); // Vai criar uma depositorio a partir da model passada no caso Category

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      // Verifica se o valor da retirada é maior que o valor em caixa, se sim ele retorno um erro, informando que tem saldo insuficiente
      throw new AppError('You do not enough balance');
    }

    // Verfica se a categoria existe
    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // Não existe crio ela
    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    // Existe ? Busco ela do banco de dados usar o id que foi retornado =>  category: transactionCategory,
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
