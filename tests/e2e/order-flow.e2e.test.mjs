import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:4000';

async function waitForBackendHealthy(timeoutMs = 120_000) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        const body = await res.json();
        if (body?.status === 'ok') return;
      }
    } catch {
      // ignore and retry
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('Backend /health did not become ready in time');
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function createOrder(customerName = 'Test Customer') {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName })
  });
  assert.equal(res.status, 201, 'Expected 201 from POST /orders');
  const body = await res.json();
  assert.ok(body.orderId, 'Response should include orderId');
  assert.ok(body.workflowId, 'Response should include workflowId');
  return body;
}

async function sendOrderAction(orderId, action, payload) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : null
  });
  assert.equal(res.status, 202, `Expected 202 from POST /orders/${orderId}/${action}`);
  return res.json();
}

async function waitForWorkflowCompleted(workflowId, timeoutMs = 180_000) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetch(`${BASE_URL}/workflows/${workflowId}/status`);
    if (res.ok) {
      const body = await res.json();
      if (body?.state === 'COMPLETED') return body;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Workflow ${workflowId} did not reach COMPLETED state in time`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

before(async () => {
  await waitForBackendHealthy();
});

test('happy-path order workflow completes successfully', async () => {
  const { orderId, workflowId } = await createOrder('E2E Customer');

  await sendOrderAction(orderId, 'approve');
  await sendOrderAction(orderId, 'assign-driver', { driverId: 'driver-1' });
  await sendOrderAction(orderId, 'driver-accept');
  await sendOrderAction(orderId, 'pickup');
  await sendOrderAction(orderId, 'deliver');

  const status = await waitForWorkflowCompleted(workflowId);
  assert.equal(status.state, 'COMPLETED');
});

