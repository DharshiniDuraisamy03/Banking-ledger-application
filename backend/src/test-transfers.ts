import request from 'supertest';
import { app } from './app.js';
import { db, initDb } from './db/index.js';

console.log('--- Testing Step 5: Money Transfer API (Bonus Feature) ---');

initDb();

async function runTransferTests() {
  try {
    // 1. Create Account A with initial balance 100
    const resA = await request(app).post('/api/accounts').send({
      name: 'Account A (Alice)',
      initial_balance: 100,
    });
    const accAId = resA.body.data.id;
    console.log(`✅ Created Account A with balance: ${resA.body.data.balance} (ID: ${accAId})`);

    // 2. Create Account B with initial balance 50
    const resB = await request(app).post('/api/accounts').send({
      name: 'Account B (Bob)',
      initial_balance: 50,
    });
    const accBId = resB.body.data.id;
    console.log(`✅ Created Account B with balance: ${resB.body.data.balance} (ID: ${accBId})`);

    // 3. Exact prompt scenario: Transfer 30 from A to B
    const runId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const testRef = `TRF-TEST-${runId}`;
    console.log(`\n🔍 Executing Transfer: 30 from Account A to Account B (Ref: ${testRef})...`);
    const resTransfer = await request(app).post('/api/transfers').send({
      source_account_id: accAId,
      destination_account_id: accBId,
      amount: 30,
      reference_id: testRef,
      description: 'Transfer from Alice to Bob',
    });

    console.log(`✅ [POST /api/transfers] Status: ${resTransfer.status}`);
    console.log(`- Transfer ID: ${resTransfer.body.data.transfer.id}`);
    console.log(`- Account A New Balance: ${resTransfer.body.data.sourceAccount.newBalance}`);
    console.log(`- Account B New Balance: ${resTransfer.body.data.destinationAccount.newBalance}`);

    if (
      resTransfer.status !== 201 ||
      resTransfer.body.data.sourceAccount.newBalance !== 70 ||
      resTransfer.body.data.destinationAccount.newBalance !== 80
    ) {
      throw new Error('Transfer balance result does not match expected (70 and 80)!');
    }

    // 4. Verify Account A ledger consistency
    const balanceA = await request(app).get(`/api/accounts/${accAId}/balance`);
    console.log(
      `✅ Account A Balance: ${balanceA.body.data.balance}, Ledger Sum: ${balanceA.body.data.ledgerBalance}, Consistent: ${balanceA.body.data.isConsistent}`
    );

    // 5. Verify Account B ledger consistency
    const balanceB = await request(app).get(`/api/accounts/${accBId}/balance`);
    console.log(
      `✅ Account B Balance: ${balanceB.body.data.balance}, Ledger Sum: ${balanceB.body.data.ledgerBalance}, Consistent: ${balanceB.body.data.isConsistent}`
    );

    if (!balanceA.body.data.isConsistent || !balanceB.body.data.isConsistent) {
      throw new Error('Ledger balance consistency mismatch after transfer!');
    }

    // 6. Test Self-transfer prevention
    console.log('\n🔍 Testing Self-Transfer Prevention...');
    const resSelfTransfer = await request(app).post('/api/transfers').send({
      source_account_id: accAId,
      destination_account_id: accAId,
      amount: 10,
      reference_id: 'TRF-SELF-FAIL',
    });
    console.log(
      `✅ Self-Transfer Rejected: Status ${resSelfTransfer.status} (Error: ${resSelfTransfer.body.error})`
    );
    if (resSelfTransfer.status !== 400) throw new Error('Expected 400 for self-transfer');

    // 7. Test Insufficient Balance & Atomicity (Source has 70, attempt to transfer 100)
    console.log('\n🔍 Testing Insufficient Balance Transfer & Rollback...');
    const resOverdraft = await request(app).post('/api/transfers').send({
      source_account_id: accAId,
      destination_account_id: accBId,
      amount: 100,
      reference_id: 'TRF-OVERDRAFT-FAIL',
    });
    console.log(
      `✅ Overdraft Transfer Rejected: Status ${resOverdraft.status} (Error: ${resOverdraft.body.error})`
    );
    if (resOverdraft.status !== 400) throw new Error('Expected 400 for overdraft transfer');

    // Check that balances remained 70 and 80 untouched
    const checkA = await request(app).get(`/api/accounts/${accAId}`);
    const checkB = await request(app).get(`/api/accounts/${accBId}`);
    console.log(`✅ Verified untouched balances after failed transfer: A=${checkA.body.data.balance}, B=${checkB.body.data.balance}`);
    if (checkA.body.data.balance !== 70 || checkB.body.data.balance !== 80) {
      throw new Error('Rollback failed! Balances changed on failed transfer!');
    }

    // 8. Test Duplicate transfer reference ID
    console.log('\n🔍 Testing Duplicate Transfer Reference...');
    const resDuplicate = await request(app).post('/api/transfers').send({
      source_account_id: accAId,
      destination_account_id: accBId,
      amount: 5,
      reference_id: testRef, // Already used in Test 3
    });
    console.log(
      `✅ Duplicate Transfer Reference Rejected: Status ${resDuplicate.status} (Error: ${resDuplicate.body.error})`
    );
    if (resDuplicate.status !== 409) throw new Error('Expected 409 for duplicate transfer reference');

    // 9. Test Non-existent destination account
    console.log('\n🔍 Testing Ghost Destination Account...');
    const resGhost = await request(app).post('/api/transfers').send({
      source_account_id: accAId,
      destination_account_id: '00000000-0000-0000-0000-000000000000',
      amount: 10,
      reference_id: 'TRF-GHOST-FAIL',
    });
    console.log(
      `✅ Ghost Account Rejected: Status ${resGhost.status} (Error: ${resGhost.body.error})`
    );
    if (resGhost.status !== 404) throw new Error('Expected 404 for ghost account');

    // 10. List all transfers
    const resList = await request(app).get('/api/transfers');
    console.log(`✅ [GET /api/transfers] Status: ${resList.status}, Total Recorded Transfers: ${resList.body.count}`);

    console.log('\n🎉 ALL STEP 5 MONEY TRANSFER TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('Transfer Test Failed:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

runTransferTests();
