import React, { useState } from 'react';
import { createOrder, sendAction } from '../api/client';

interface Props {
  onOrderCreated(orderId: string, workflowId: string): void;
}

const OrderActionsPanel: React.FC<Props> = ({ onOrderCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [simulateFailureSteps, setSimulateFailureSteps] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFailureSteps = () =>
    simulateFailureSteps
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await createOrder(customerName, parseFailureSteps());
      setOrderId(result.orderId);
      onOrderCreated(result.orderId, result.workflowId);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create order');
    } finally {
      setBusy(false);
    }
  };

  const action = (name: Parameters<typeof sendAction>[1], payload?: any) => async () => {
    if (!orderId) {
      setError('Order ID is required (create an order first)');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendAction(orderId, name, payload);
    } catch (e: any) {
      setError(e?.message ?? 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Order Actions</h2>
      <div>
        <label>Customer Name</label>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
      </div>
      <div>
        <label>Simulate Failures (comma separated steps)</label>
        <input
          value={simulateFailureSteps}
          onChange={(e) => setSimulateFailureSteps(e.target.value)}
          placeholder="createTripRecord,deliver"
        />
      </div>
      <button onClick={handleCreate} disabled={busy || !customerName}>
        Create Order &amp; Start Workflow
      </button>

      <div>
        <label>Current Order ID</label>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} />
      </div>
      <div>
        <label>Driver ID</label>
        <input value={driverId} onChange={(e) => setDriverId(e.target.value)} />
      </div>

      <div>
        <button onClick={action('approve')} disabled={busy}>
          Approve Order
        </button>
        <button onClick={action('assign-driver', { driverId })} disabled={busy || !driverId}>
          Assign Driver
        </button>
        <button onClick={action('driver-accept')} disabled={busy}>
          Driver Accept
        </button>
        <button onClick={action('pickup')} disabled={busy}>
          Pickup
        </button>
        <button onClick={action('deliver')} disabled={busy}>
          Deliver
        </button>
        <button onClick={action('cancel')} disabled={busy}>
          Cancel Order
        </button>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default OrderActionsPanel;

