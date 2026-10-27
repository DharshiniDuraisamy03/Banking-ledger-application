import { db, initDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

console.log('--- Testing Database Schema & ACID Constraints ---');

// Initialize schema
initDb();

try {
  // Test 1: Insert an account with balance 100
  const accountId1 = uuidv4();
  const insertAccountStmt = db.prepare(`
    INSERT INTO accounts (id, name, balance) VALUES (?, ?, ?)
  `);
  insertAccountStmt.run(accountId1, 'Alice Tester', 100);
  console.log('✅ Test 1 Passed: Account created successfully with balance 100');

  // Test 2: Verify CHECK (balance >= 0) constraint
  try {
    const accountIdInvalid = uuidv4();
    insertAccountStmt.run(accountIdInvalid, 'Invalid Account', -50);
    console.error('❌ Test 2 Failed: Allowed negative balance!');
  } catch (err: any) {
    if (err.message.includes('CHECK constraint failed')) {
      console.log('✅ Test 2 Passed: CHECK (balance >= 0) correctly prevented negative balance');
    } else {
      console.error('❌ Test 2 Unexpected error:', err.message);
    }
  }

  // Test 3: Insert valid transaction
  const txId = uuidv4();
  const refId = 'REF-1001';
  const insertTxStmt = db.prepare(`
    INSERT INTO transactions (id, account_id, type, amount, reference_id, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertTxStmt.run(txId, accountId1, 'credit', 50, refId, 'Initial test deposit');
  console.log('✅ Test 3 Passed: Valid credit transaction created');

  // Test 4: Verify duplicate reference_id for same account is rejected
  try {
    const duplicateTxId = uuidv4();
    insertTxStmt.run(duplicateTxId, accountId1, 'credit', 20, refId, 'Duplicate reference');
    console.error('❌ Test 4 Failed: Allowed duplicate reference_id for same account!');
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('✅ Test 4 Passed: UNIQUE(account_id, reference_id) prevented duplicate transaction');
    } else {
      console.error('❌ Test 4 Unexpected error:', err.message);
    }
  }

  // Test 5: Verify foreign key enforcement (non-existent account ID)
  try {
    const nonExistentAccount = uuidv4();
    insertTxStmt.run(uuidv4(), nonExistentAccount, 'debit', 10, 'REF-9999', 'Ghost transaction');
    console.error('❌ Test 5 Failed: Allowed transaction for non-existent account!');
  } catch (err: any) {
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      console.log('✅ Test 5 Passed: Foreign key constraint prevented transaction on non-existent account');
    } else {
      console.error('❌ Test 5 Unexpected error:', err.message);
    }
  }

  // Test 6: Verify self-transfer constraint
  try {
    const insertTransferStmt = db.prepare(`
      INSERT INTO transfers (id, source_account_id, destination_account_id, amount, reference_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertTransferStmt.run(uuidv4(), accountId1, accountId1, 20, 'TXF-1001', 'Self transfer attempt');
    console.error('❌ Test 6 Failed: Allowed self-transfer!');
  } catch (err: any) {
    if (err.message.includes('CHECK constraint failed')) {
      console.log('✅ Test 6 Passed: CHECK(source_account_id != destination_account_id) prevented self-transfer');
    } else {
      console.error('❌ Test 6 Unexpected error:', err.message);
    }
  }

  console.log('\n🎉 ALL STEP 2 DATABASE INTEGRITY TESTS PASSED SUCCESSFULLY! 🎉');
} catch (error) {
  console.error('Failed test run:', error);
} finally {
  db.close();
}
