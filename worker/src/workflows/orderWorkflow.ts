import { proxyActivities, defineSignal, defineQuery, setHandler, condition, patched } from '@temporalio/workflow';
import type { OrderWorkflowState, AssignDriverPayload, FailureInfo, OrderWorkflowProgress, WorkflowVersionInfo } from './signals';
import type * as activities from '../activities/orderActivities';

const {
  createOrderRecord,
  createTripRecord,
  updateOrderStatus,
  updateTripStatus,
  logActivityAttempt
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 5
  }
});

export interface OrderWorkflowInput {
  orderId: string;
  customerName: string;
  simulateFailureSteps?: string[];
}

export const approveOrderSignal = defineSignal('approveOrder');
export const assignDriverSignal = defineSignal<[AssignDriverPayload]>('assignDriver');
export const driverAcceptSignal = defineSignal('driverAccept');
export const pickupSignal = defineSignal('pickup');
export const deliverSignal = defineSignal('deliver');
export const cancelOrderSignal = defineSignal('cancelOrder');

export const currentStateQuery = defineQuery<OrderWorkflowState>('getCurrentState');
export const progressQuery = defineQuery<OrderWorkflowProgress>('getProgress');
export const failureInfoQuery = defineQuery<FailureInfo>('getFailureInfo');
export const versionInfoQuery = defineQuery<WorkflowVersionInfo>('getVersionInfo');

export async function orderWorkflow(input: OrderWorkflowInput): Promise<void> {
  let state: OrderWorkflowState = 'ORDER_CREATED';
  let cancelled = false;
  let tripId: string | undefined;
  let failureInfo: FailureInfo = { retryCount: 0 };
  let driverId: string | undefined;
  let approved = false;
  let driverAssigned = false;
  let driverAccepted = false;
  let pickedUp = false;
  let delivered = false;

  const shouldSimulateFailure = (step: string) => input.simulateFailureSteps?.includes(step) ?? false;
  const v2DriverCheckEnabled = patched('order-flow-v2-driver-check');

  setHandler(approveOrderSignal, () => {
    approved = true;
  });
  setHandler(assignDriverSignal, ({ driverId: assigned }) => {
    driverId = assigned;
    driverAssigned = true;
  });
  setHandler(driverAcceptSignal, () => {
    driverAccepted = true;
  });
  setHandler(pickupSignal, () => {
    pickedUp = true;
  });
  setHandler(deliverSignal, () => {
    delivered = true;
  });
  setHandler(cancelOrderSignal, () => {
    cancelled = true;
  });

  setHandler(currentStateQuery, () => state);
  setHandler(progressQuery, () => ({
    state,
    orderId: input.orderId,
    tripId
  }));
  setHandler(failureInfoQuery, () => failureInfo);
  setHandler(versionInfoQuery, () => ({
    codeVersion: v2DriverCheckEnabled ? 'v2' : 'v1',
    patchMarkers: { orderFlowV2DriverCheck: v2DriverCheckEnabled }
  }));

  await createOrderRecord({
    orderId: input.orderId,
    customerName: input.customerName,
    status: state,
    note: 'Initial order creation'
  });

  state = 'AWAIT_SUPERVISOR_APPROVAL';

  await condition(() => approved || cancelled);
  if (cancelled) {
    state = 'CANCELLED';
    await updateOrderStatus({
      orderId: input.orderId,
      status: state,
      previousStatus: 'AWAIT_SUPERVISOR_APPROVAL'
    });
    return;
  }

  await withActivityLogging('createTripRecord', async () => {
    const result = await createTripRecord({
      orderId: input.orderId,
      driverId: null,
      status: 'TRIP_CREATED',
      simulateFailure: shouldSimulateFailure('createTripRecord')
    });
    tripId = result.tripId;
  });

  state = 'TRIP_CREATED';
  await updateOrderStatus({
    orderId: input.orderId,
    status: state,
    previousStatus: 'AWAIT_SUPERVISOR_APPROVAL'
  });

  state = 'AWAIT_DRIVER_ASSIGNMENT';
  await condition(() => driverAssigned || cancelled);
  if (cancelled) {
    state = 'CANCELLED';
    await updateOrderStatus({
      orderId: input.orderId,
      status: state,
      previousStatus: 'AWAIT_DRIVER_ASSIGNMENT'
    });
    if (tripId) {
      await updateTripStatus({
        tripId,
        status: 'CANCELLED',
        previousStatus: 'TRIP_CREATED'
      });
    }
    return;
  }

  await withActivityLogging('assignDriver', async () => {
    if (!tripId || !driverId) {
      throw new Error('Trip or driver missing when assigning driver');
    }
    await updateTripStatus({
      tripId,
      status: 'AWAIT_DRIVER_ACCEPT',
      driverId,
      previousStatus: 'TRIP_CREATED',
      simulateFailure: shouldSimulateFailure('assignDriver')
    });
  });

  state = 'AWAIT_DRIVER_ACCEPT';
  await updateOrderStatus({
    orderId: input.orderId,
    status: state,
    previousStatus: 'AWAIT_DRIVER_ASSIGNMENT'
  });

  await condition(() => driverAccepted || cancelled);
  if (cancelled) {
    state = 'CANCELLED';
    await updateOrderStatus({
      orderId: input.orderId,
      status: state,
      previousStatus: 'AWAIT_DRIVER_ACCEPT'
    });
    if (tripId) {
      await updateTripStatus({
        tripId,
        status: 'CANCELLED',
        previousStatus: 'AWAIT_DRIVER_ACCEPT'
      });
    }
    return;
  }

  await withActivityLogging('pickup', async () => {
    if (!tripId) {
      throw new Error('Trip missing on pickup');
    }
    await updateTripStatus({
      tripId,
      status: 'PICKED_UP',
      previousStatus: 'AWAIT_DRIVER_ACCEPT',
      simulateFailure: shouldSimulateFailure('pickup')
    });
  });

  state = 'PICKED_UP';
  await updateOrderStatus({
    orderId: input.orderId,
    status: state,
    previousStatus: 'AWAIT_DRIVER_ACCEPT'
  });

  await condition(() => delivered || cancelled);
  if (cancelled) {
    state = 'CANCELLED';
    await updateOrderStatus({
      orderId: input.orderId,
      status: state,
      previousStatus: 'PICKED_UP'
    });
    if (tripId) {
      await updateTripStatus({
        tripId,
        status: 'CANCELLED',
        previousStatus: 'PICKED_UP'
      });
    }
    return;
  }

  if (v2DriverCheckEnabled && !driverId) {
    throw new Error('V2 logic requires driverId before delivery');
  }

  await withActivityLogging('deliver', async () => {
    if (!tripId) {
      throw new Error('Trip missing on deliver');
    }
    await updateTripStatus({
      tripId,
      status: 'DELIVERED',
      previousStatus: 'PICKED_UP',
      simulateFailure: shouldSimulateFailure('deliver')
    });
  });

  state = 'DELIVERED';
  await updateOrderStatus({
    orderId: input.orderId,
    status: state,
    previousStatus: 'PICKED_UP'
  });

  state = 'COMPLETED';
  await updateOrderStatus({
    orderId: input.orderId,
    status: state,
    previousStatus: 'DELIVERED'
  });

  async function withActivityLogging(activityName: string, fn: () => Promise<void>): Promise<void> {
    try {
      await logActivityAttempt({
        orderId: input.orderId,
        activityName,
        status: 'STARTED',
        step: activityName
      });
      await fn();
      await logActivityAttempt({
        orderId: input.orderId,
        activityName,
        status: 'SUCCEEDED',
        step: activityName
      });
    } catch (err: any) {
      failureInfo = {
        lastErrorMessage: err?.message ?? String(err),
        lastFailedActivity: activityName,
        retryCount: failureInfo.retryCount + 1
      };
      await logActivityAttempt({
        orderId: input.orderId,
        activityName,
        status: 'FAILED',
        errorMessage: failureInfo.lastErrorMessage,
        step: activityName
      });
      throw err;
    }
  }
}

