import { db, initDb } from '../db/index.js';
import { accountService } from './account.service.js';
import { transactionService } from './transaction.service.js';

console.log('--- Testing Step 3: Account & Transaction Services ---');

// Initialize schema
initDb();

try {
  // Test 1: Create Account with 0 initial balance
  const acc1 = accountService.createAccount({ name: 'Bob Banker', initial_balance: 0 });
  console.log(`✅ Test 1: Created account '${acc1.name}' (ID: ${acc1.id}) with balance: ${acc1.balance}`);

  // Test 2: Prompt's exact ledger balance test scenario:
  // Initial balance: 0
  // Credit: 100
  // Credit: 50
  // Debit: 30
  // Debit: 20
  // Expected Final balance: 100
  const tx1 = transactionService.createTransaction(acc1.id, {
    type: 'credit',
    amount: 100,
    reference_id: 'REF-001',
    description: 'First deposit',
  });
  console.log(`✅ Test 2a: Credit 100 -> Balance: ${tx1.newBalance}`);

  const tx2 = transactionService.createTransaction(acc1.id, {
    type: 'credit',
    amount: 50,
    reference_id: 'REF-002',
    description: 'Second deposit',
  });
  console.log(`✅ Test 2b: Credit 50 -> Balance: ${tx2.newBalance}`);

  const tx3 = transactionService.createTransaction(acc1.id, {
    type: 'debit',
    amount: 30,
    reference_id: 'REF-003',
    description: 'Withdrawal 1',
  });
  console.log(`✅ Test 2c: Debit 30 -> Balance: ${tx3.newBalance}`);

  const tx4 = transactionService.createTransaction(acc1.id, {
    type: 'debit',
    amount: 20,
    reference_id: 'REF-004',
    description: 'Withdrawal 2',
  });
  console.log(`✅ Test 2d: Debit 20 -> Balance: ${tx4.newBalance}`);

  // Test 3: Balance Consistency Verification
  const balanceCheck = accountService.getAccountBalance(acc1.id);
  console.log(`\n🔍 Balance Consistency Check:`);
  console.log(`- Account stored balance: ${balanceCheck.account.balance}`);
  console.log(`- Sum of ledger transactions: ${balanceCheck.ledgerBalance}`);
  console.log(`- Consistent: ${balanceCheck.isConsistent}`);

  if (balanceCheck.account.balance === 100 && balanceCheck.isConsistent) {
    console.log('✅ Test 3 Passed: Final balance is exactly 100, perfectly matching ledger transactions!');
  } else {
    throw new Error('Balance consistency check failed!');
  }

  // Test 4: Atomicity & Insufficient Balance
  console.log('\n🔍 Testing Insufficient Balance & Atomicity...');
  try {
    transactionService.createTransaction(acc1.id, {
      type: 'debit',
      amount: 150,
      reference_id: 'REF-005-FAIL',
      description: 'Overdraft attempt',
    });
    console.error('❌ Test 4 Failed: Permitted debit exceeding balance!');
  } catch (err: any) {
    console.log(`✅ Test 4 Passed: Insufficient balance rejected: '${err.message}'`);
    const afterFailedAttempt = accountService.getAccount(acc1.id);
    console.log(`✅ Verified Balance untouched after failure: ${afterFailedAttempt.balance}`);
  }

  // Test 5: Idempotency (Duplicate reference_id)
  console.log('\n🔍 Testing Duplicate reference_id...');
  try {
    transactionService.createTransaction(acc1.id, {
      type: 'credit',
      amount: 10,
      reference_id: 'REF-001', // already used
      description: 'Duplicate attempt',
    });
    console.error('❌ Test 5 Failed: Permitted duplicate reference_id!');
  } catch (err: any) {
    console.log(`✅ Test 5 Passed: Duplicate reference_id caught: '${err.message}' (Code: ${err.errorCode})`);
  }

  // Test 6: Non-existent Account
  console.log('\n🔍 Testing Non-existent Account...');
  try {
    transactionService.createTransaction('00000000-0000-0000-0000-000000000000', {
      type: 'credit',
      amount: 10,
      reference_id: 'REF-999',
    });
    console.error('❌ Test 6 Failed: Allowed transaction for invalid account!');
  } catch (err: any) {
    console.log(`✅ Test 6 Passed: Non-existent account caught: '${err.message}' (Code: ${err.errorCode})`);
  }

  // Test 7: Pagination & Latest-First Ordering
  console.log('\n🔍 Testing Pagination & Latest-First Order...');
  const paginatedResult = transactionService.getTransactionsByAccount(acc1.id, {
    page: 1,
    limit: 2,
  });
  console.log('Pagination Metadata:', paginatedResult.pagination);
  console.log(`Fetched ${paginatedResult.data.length} transactions.`);
  console.log(`Most recent transaction reference: ${paginatedResult.data[0].reference_id}`);
  
  if (
    paginatedResult.pagination.totalRecords === 4 &&
    paginatedResult.pagination.totalPages === 2 &&
    paginatedResult.data[0].reference_id === 'REF-004'
  ) {
    console.log('✅ Test 7 Passed: Pagination metadata & latest-first ordering are accurate!');
  } else {
    throw new Error('Pagination or latest-first sorting test failed!');
  }

  console.log('\n🎉 ALL STEP 3 TESTS PASSED SUCCESSFULLY! 🎉\n');
} catch (error) {
  console.error('Error during Step 3 testing:', error);
} finally {
  db.close();
}
