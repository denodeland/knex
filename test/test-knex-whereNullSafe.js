const Knex = require('../lib/index');

const config = {
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: '123456',
  },
};
const dbName = 'knex_test';

async function createDatabase() {
  const knex = Knex(config);
  try {
    await knex.raw(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database ${dbName} created or already exists.`);
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await knex.destroy();
  }
}

const knex = Knex({
  ...config,
  connection: {
    ...config.connection,
    database: dbName,
  },
});

async function setupDatabase() {
  await knex.schema.dropTableIfExists('users');
  await knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('name');
    table.string('email');
  });

  await knex('users').insert([
    { id: 1, name: 'Juan', email: 'juan@denode.com' },
    { id: 2, name: 'Elias', email: null },
    { id: 3, name: 'Marcos', email: 'marcos@denode.com' },
    { id: 4, name: 'Paula', email: null },
  ]);
}

function findUsersWithIdAndUnconfirmedEmail(userId) {
  return knex('users')
    .whereNullSafe('id', userId)
    .whereNullSafe('email', null)
    .select('*');
}

function findUsersWithOrConditions(name, email) {
  return knex('users')
    .where('name', name)
    .orWhereNullSafe('email', email)
    .select('*');
}

function cleanResults(results) {
  return JSON.parse(JSON.stringify(results));
}

async function runTests() {
  try {
    // await createDatabase();
    // await setupDatabase();
    console.log('Test 1: Find user with ID 2 and null email');
    let results = await findUsersWithIdAndUnconfirmedEmail(2);
    console.log(cleanResults(results));

    console.log(
      '\nTest 2: Find user with ID 1 and null email (should return empty)'
    );
    results = await findUsersWithIdAndUnconfirmedEmail(1);
    console.log(cleanResults(results));

    console.log('\nTest 3: Find user with ID null and null email');
    results = await findUsersWithIdAndUnconfirmedEmail(null);
    console.log(cleanResults(results));

    console.log('\nTest 4: Raw SQL for comparison');
    const rawSql = knex('users')
      .whereNullSafe('id', 2)
      .whereNullSafe('email', null)
      .select('*')
      .toSQL();
    console.log('SQL:', rawSql.sql);
    console.log('Bindings:', rawSql.bindings);

    console.log('\nTest 5: orWhereNullSafe with non-null value');
    results = await findUsersWithOrConditions('Juan', 'bob@example.com');
    console.log(cleanResults(results));

    console.log('\nTest 6: orWhereNullSafe with null value');
    results = await findUsersWithOrConditions('Marcos', null);
    console.log(cleanResults(results));

    console.log('\nTest 7: Complex query with multiple orWhereNullSafe');
    results = await knex('users')
      .where('name', 'Juan')
      .orWhereNullSafe('email', null)
      .orWhereNullSafe('id', 3)
      .select('*');
    console.log(cleanResults(results));

    console.log('\nTest 8: orWhereNullSafe with all null values');
    results = await knex('users')
      .whereNullSafe('name', null)
      .orWhereNullSafe('email', null)
      .select('*');
    console.log(cleanResults(results));

    console.log('\nTest 9: Raw SQL for orWhereNullSafe');
    const rawSql2 = knex('users')
      .where('name', 'Juan')
      .orWhereNullSafe('email', null)
      .select('*')
      .toSQL();
    console.log('SQL:', rawSql2.sql);
    console.log('Bindings:', rawSql2.bindings);
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    await knex.destroy();
  }
}

runTests().catch(console.error);
