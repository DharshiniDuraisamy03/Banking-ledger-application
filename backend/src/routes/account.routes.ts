import { Router } from 'express';
import { accountController } from '../controllers/account.controller.js';
import { transactionController } from '../controllers/transaction.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { accountIdParamSchema, createAccountSchema } from '../schemas/account.schema.js';
import { createTransactionSchema, transactionPaginationSchema } from '../schemas/transaction.schema.js';

const router = Router();

// Account endpoints
router.post(
  '/',
  validateBody(createAccountSchema),
  accountController.createAccount
);

router.get(
  '/',
  accountController.getAllAccounts
);

router.get(
  '/:id',
  validateParams(accountIdParamSchema),
  accountController.getAccountById
);

router.get(
  '/:id/balance',
  validateParams(accountIdParamSchema),
  accountController.getAccountBalance
);

// Transaction endpoints nested under account
router.post(
  '/:id/transactions',
  validateParams(accountIdParamSchema),
  validateBody(createTransactionSchema),
  transactionController.createTransaction
);

router.get(
  '/:id/transactions',
  validateParams(accountIdParamSchema),
  validateQuery(transactionPaginationSchema),
  transactionController.getTransactions
);

export const accountRouter = router;
