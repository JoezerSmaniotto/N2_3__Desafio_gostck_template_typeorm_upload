import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStrean = fs.createReadStream(filePath); // Vai ler o nosso arquivo

    const parsers = csvParse({
      // vai instancia a função
      from_line: 2, // Vai começar na linha 2 do csv pq a linha 1 é header, pois o csvParse começa na linha 1 por isso altero para  alinha 2
    });

    const parseCSV = contactsReadStrean.pipe(parsers); // Conforme a linha estiver disponivel para a leitura ele vai lendo
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    // A cada linha que passar irei desestruturar
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map(
        (cell: string) => cell.trim(), // tipo os espaços
      );
      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    // Como parseCSV não é sincrono, não acontece em tempo real, por isso crio a promise para verificar sem o parseCSV emitiu um evento END,  assim retornando completo o conteudo
    await new Promise(resolve => parseCSV.on('end', resolve));

    // Verifico se as categorias q estou criando já não existe no banco de dados
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories), // Verifica se alguma das categorias listei estão no BD com o metodo In
      },
    });

    // Aqui tenho as categorias q já existem no banco de dados
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );
    // Aqui tenho as categorias que não estão no BD
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); // Com esse segundo filter eu tiro categorias repitidas que possam me tornar
    console.log(addCategoryTitles);
    // console.log(existentCategoriesTitles);
    // console.log(transactions);

    // Salvo no banco
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories]; // Junta todos as categorias agora

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
// value  = String
// index = index atual number
// self = array de categorias array decategorias
