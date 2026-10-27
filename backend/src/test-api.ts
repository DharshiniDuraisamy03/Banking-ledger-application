import request from 'supertest';
import { app } from './app.js';
import { db, initDb } from './db/index.js';

console.log('--- Testing Step 4: REST API Integration via HTTP ---');

// Initialize schema
initDb();

async function runApiTests() {
  try {
    // 1. Healthcheck
    const resHealth = await request(app).get('/health');
    console.log(`✅ [GET /health] Status: ${resHealth.status} - ${resHealth.body.service}`);

    // 2. Validation: Account name required
    const resAccInvalid = await request(app).post('/api/accounts').send({});
    console.log(
      `✅ [POST /api/accounts (missing name)] Status: ${resAccInvalid.status} (Error: ${resAccInvalid.body.error})`
    );
    if (resAccInvalid.status !== 400) throw new Error('Expected 400 for missing account name');

    // 3. Create Account
    const resAcc = await request(app).post('/api/accounts').send({
      name: 'Alice Johnson',
      initial_balance: 0,
    });
    console.log(
      `✅ [POST /api/accounts] Status: ${resAcc.status} - Created Account ID: ${resAcc.body.data.id}`
    );
    if (resAcc.status !== 201) throw new Error('Expected 201 for account creation');
    const accountId = resAcc.body.data.id;

    // 4. Get Account by ID
    const resGetAcc = await request(app).get(`/api/accounts/${accountId}`);
    console.log(
      `✅ [GET /api/accounts/:id] Status: ${resGetAcc.status} - Name: ${resGetAcc.body.data.name}, Balance: ${resGetAcc.body.data.balance}`
    );

    // 5. Get Account with invalid UUID format
    const resInvalidId = await request(app).get('/api/accounts/invalid-uuid-format');
    console.log(
      `✅ [GET /api/accounts/invalid-uuid] Status: ${resInvalidId.status} (Error: ${resInvalidId.body.error})`
    );
    if (resInvalidId.status !== 400) throw new Error('Expected 400 for invalid UUID format');

    // 6. Get Account with non-existent UUID
    const resNotFound = await request(app).get(
      '/api/accounts/00000000-0000-0000-0000-000000000000'
    );
    console.log(
      `✅ [GET /api/accounts/ghost-id] Status: ${resNotFound.status} (Error: ${resNotFound.body.error})`
    );
    if (resNotFound.status !== 404) throw new Error('Expected 404 for non-existent account');

    // 7. Assessment Exact Scenario over HTTP:
    // Credit 100, Credit 50, Debit 30, Debit 20 -> Final 100
    const tx1 = await request(app).post(`/api/accounts/${accountId}/transactions`).send({
      type: 'credit',
      amount: 100,
      reference_id: 'API-REF-001',
      description: 'First deposit',
    });
    console.log(`✅ [POST Tx 1: Credit 100] Status: ${tx1.status}, New Balance: ${tx1.body.data.newBalance}`);

    const tx2 = await request(app).post(`/api/accounts/${accountId}/transactions`).send({
      type: 'credit',
      amount: 50,
      reference_id: 'API-REF-002',
      description: 'Second deposit',
    });
    console.log(`✅ [POST Tx 2: Credit 50] Status: ${tx2.status}, New Balance: ${tx2.body.data.newBalance}`);

    const tx3 = await request(app).post(`/api/accounts/${accountId}/transactions`).send({
      type: 'debit',
      amount: 30,
      reference_id: 'API-REF-003',
      description: 'Withdrawal 1',
    });
    console.log(`✅ [POST Tx 3: Debit 30] Status: ${tx3.status}, New Balance: ${tx3.body.data.newBalance}`);

    const tx4 = await request(app).post(`/api/accounts/${accountId}/transactions`).send({
      type: 'debit',
      amount: 20,
      reference_id: 'API-REF-004',
      description: 'Withdrawal 2',
    });
    console.log(`✅ [POST Tx 4: Debit 20] Status: ${tx4.status}, New Balance: ${tx4.body.data.newBalance}`);

    // 8. Balance Check
    const resBalance = await request(app).get(`/api/accounts/${accountId}/balance`);
    console.log(
      `✅ [GET /api/accounts/:id/balance] Balance: ${resBalance.body.data.balance}, Ledger Consistency: ${resBalance.body.data.isConsistent}`
    );
    if (resBalance.body.data.balance !== 100 || !resBalance.body.data.isConsistent) {
      throw new Error('Balance consistency failed over HTTP API!');
    }

    // 9. Validation: Insufficient Balance (Debit 150)
    const txFailOverdraft = await request(app)
      .post(`/api/accounts/${accountId}/transactions`)
      .send({
        type: 'debit',
        amount: 150,
        reference_id: 'API-REF-005-FAIL',
        description: 'Should fail',
      });
    console.log(
      `✅ [POST Tx Overdraft] Status: ${txFailOverdraft.status} (Error: ${txFailOverdraft.body.error}, Message: ${txFailOverdraft.body.message})`
    );
    if (txFailOverdraft.status !== 400) throw new Error('Expected 400 for insufficient balance');

    // 10. Validation: Duplicate reference_id
    const txFailDuplicate = await request(app)
      .post(`/api/accounts/${accountId}/transactions`)
      .send({
        type: 'credit',
        amount: 25,
        reference_id: 'API-REF-001', // Already used
      });
    console.log(
      `✅ [POST Tx Duplicate Ref] Status: ${txFailDuplicate.status} (Error: ${txFailDuplicate.body.error})`
    );
    if (txFailDuplicate.status !== 409) throw new Error('Expected 409 for duplicate reference ID');

    // 11. Validation: Invalid transaction type
    const txFailType = await request(app)
      .post(`/api/accounts/${accountId}/transactions`)
      .send({
        type: 'withdraw_money',
        amount: 10,
        reference_id: 'API-REF-006',
      });
    console.log(
      `✅ [POST Tx Invalid Type] Status: ${txFailType.status} (Error: ${txFailType.body.error})`
    );
    if (txFailType.status !== 400) throw new Error('Expected 400 for invalid transaction type');

    // 12. Validation: Invalid amount <= 0
    const txFailAmount = await request(app)
      .post(`/api/accounts/${accountId}/transactions`)
      .send({
        type: 'credit',
        amount: -50,
        reference_id: 'API-REF-007',
      });
    console.log(
      `✅ [POST Tx Negative Amount] Status: ${txFailAmount.status} (Error: ${txFailAmount.body.error})`
    );
    if (txFailAmount.status !== 400) throw new Error('Expected 400 for negative amount');

    // 13. Pagination & Latest-first sorting
    const resPagination = await request(app)
      .get(`/api/accounts/${accountId}/transactions`)
      .query({ page: 1, limit: 2 });
    console.log(`✅ [GET /transactions?page=1&limit=2] Status: ${resPagination.status}`);
    console.log(`- Pagination result:`, resPagination.body.pagination);
    console.log(`- Latest item reference:`, resPagination.body.data[0].reference_id);

    if (
      resPagination.body.pagination.totalRecords === 4 &&
      resPagination.body.pagination.totalPages === 2 &&
      resPagination.body.data[0].reference_id === 'API-REF-004'
    ) {
      console.log('✅ Pagination metadata and latest-first sorting validated over HTTP!');
    } else {
      throw new Error('Pagination validation failed!');
    }

    console.log('\n🎉 ALL STEP 4 HTTP REST API INTEGRATION TESTS PASSED! 🎉\n');
  } catch (err) {
    console.error('API Test Failed:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

runApiTests();
