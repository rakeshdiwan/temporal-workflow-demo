export type OrderWorkflowState =
  | 'ORDER_CREATED'
  | 'AWAIT_SUPERVISOR_APPROVAL'
  | 'TRIP_CREATED'
  | 'AWAIT_DRIVER_ASSIGNMENT'
  | 'AWAIT_DRIVER_ACCEPT'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AssignDriverPayload {
  driverId: string;
}

export interface FailureInfo {
  lastErrorMessage?: string;
  lastFailedActivity?: string;
  retryCount: number;
}

export interface WorkflowVersionInfo {
  codeVersion: 'v1' | 'v2';
  patchMarkers: {
    orderFlowV2DriverCheck: boolean;
  };
}

export interface OrderWorkflowProgress {
  state: OrderWorkflowState;
  orderId: string;
  tripId?: string;
}

export interface OrderWorkflowQueries {
  getCurrentState(): OrderWorkflowState;
  getProgress(): OrderWorkflowProgress;
  getFailureInfo(): FailureInfo;
  getVersionInfo(): WorkflowVersionInfo;
}

