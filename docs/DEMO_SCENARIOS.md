# Demo Scenarios

## Happy path

1. Open React dashboard `http://localhost:5173`
2. Create an order (customer name)
3. Click in order:
   - Approve Order
   - Assign Driver (enter driverId)
   - Driver Accept
   - Pickup
   - Deliver
4. Verify Temporal UI `http://localhost:8080` shows workflow completed.

## Simulated failures & retries

- When creating the order, set **Simulate Failures** to:
  - `createTripRecord` or `assignDriver` or `pickup` or `deliver`
- Watch activity retries in Temporal UI.

## Versioning demo (patch marker)

1. Start a workflow.
2. Deploy a code change guarded by `patched('order-flow-v2-driver-check')`.
3. Start another workflow.
4. Compare `GET /workflows/:workflowId/status` and check `versionInfo`.

