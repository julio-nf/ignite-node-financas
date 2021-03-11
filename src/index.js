import express, { json } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(json());

const customers = [];

// Middleware
function verifyIfAccountExists(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf == cpf);

  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  req.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, cur) => {
    if (cur.type === 'credit') {
      return acc + cur.amount;
    }
    return acc - cur.amount;
  }, 0);

  return balance;
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

  if (customerAlreadyExists) {
    return res.status(400).json({ error: 'Customer already exists' });
  }

  const account = {
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  };

  customers.push(account);

  return res.status(201).send();
});

app.get('/statement', verifyIfAccountExists, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.post('/deposit', verifyIfAccountExists, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post('/withdraw', verifyIfAccountExists, (req, res) => {
  const { amount } = req.body;

  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_ad: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get('/statement/date', verifyIfAccountExists, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date);

  const statement = customer.statement.filter(
    (stmt) => stmt.created_at.toDateString() === new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put('/account', verifyIfAccountExists, (req, res) => {
  const { name } = req.body;

  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

app.get('/account', verifyIfAccountExists, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

app.delete('/account', verifyIfAccountExists, (req, res) => {
  const { customer } = req;

  const customerIndex = customers.findIndex((customers) => customers.cpf === customer.cpf);

  customers.splice(customerIndex, 1);

  return res.status(204).send();
});

app.get('/balance', verifyIfAccountExists, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.listen(3333);
