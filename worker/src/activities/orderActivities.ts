import { getPool } from '../db';

export interface CreateOrderRecordInput {
  orderId: string;
  customerName: string;
  status: string;
  note?: string;
}

export interface CreateOrderRecordResult {
  orderId: string;
  customerName: string;
  status: string;
  createdAt: string;
  success: true;
}

export async function createOrderRecord(input: CreateOrderRecordInput): Promise<CreateOrderRecordResult> {
  const db = getPool();
  const createdAt = new Date().toISOString();
  await db.query(
    `INSERT INTO orders (order_id, customer_name, status, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [input.orderId, input.customerName, input.status]
  );
  return {
    orderId: input.orderId,
    customerName: input.customerName,
    status: input.status,
    createdAt,
    success: true
  };
}

export interface CreateTripRecordInput {
  orderId: string;
  driverId: string | null;
  status: string;
  simulateFailure?: boolean;
}

export interface CreateTripRecordResult {
  tripId: string;
  orderId: string;
  status: string;
  driverId: string | null;
  createdAt: string;
  success: true;
}

export async function createTripRecord(input: CreateTripRecordInput): Promise<CreateTripRecordResult> {
  const db = getPool();
  if (input.simulateFailure) {
    throw new Error('Simulated failure in createTripRecord');
  }
  const createdAt = new Date().toISOString();
  const result = await db.query(
    `INSERT INTO trips (order_id, driver_id, status, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING trip_id`,
    [input.orderId, input.driverId, input.status]
  );
  const tripId = result.rows[0].trip_id as string;
  return {
    tripId,
    orderId: input.orderId,
    status: input.status,
    driverId: input.driverId,
    createdAt,
    success: true
  };
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  previousStatus?: string;
}

export interface UpdateOrderStatusResult {
  orderId: string;
  previousStatus: string | undefined;
  newStatus: string;
  updatedAt: string;
  success: true;
}

export async function updateOrderStatus(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusResult> {
  const db = getPool();
  const updatedAt = new Date().toISOString();
  await db.query(
    `UPDATE orders
     SET status = $2,
         updated_at = NOW()
     WHERE order_id = $1`,
    [input.orderId, input.status]
  );
  return {
    orderId: input.orderId,
    previousStatus: input.previousStatus,
    newStatus: input.status,
    updatedAt,
    success: true
  };
}

export interface UpdateTripStatusInput {
  tripId: string;
  status: string;
  driverId?: string;
  simulateFailure?: boolean;
  previousStatus?: string;
}

export interface UpdateTripStatusResult {
  tripId: string;
  orderId: string;
  previousStatus: string | undefined;
  newStatus: string;
  driverId: string | undefined;
  updatedAt: string;
  success: true;
}

export async function updateTripStatus(input: UpdateTripStatusInput): Promise<UpdateTripStatusResult> {
  const db = getPool();
  if (input.simulateFailure) {
    throw new Error('Simulated failure in updateTripStatus');
  }
  const updatedAt = new Date().toISOString();
  await db.query(
    `UPDATE trips
     SET status = $2,
         driver_id = COALESCE($3, driver_id),
         updated_at = NOW()
     WHERE trip_id = $1`,
    [input.tripId, input.status, input.driverId ?? null]
  );
  const row = await db.query(`SELECT order_id FROM trips WHERE trip_id = $1`, [input.tripId]);
  const orderId = (row.rows[0]?.order_id as string) ?? '';
  return {
    tripId: input.tripId,
    orderId,
    previousStatus: input.previousStatus,
    newStatus: input.status,
    driverId: input.driverId,
    updatedAt,
    success: true
  };
}

export interface LogActivityAttemptInput {
  orderId: string;
  activityName: string;
  status: 'STARTED' | 'SUCCEEDED' | 'FAILED';
  errorMessage?: string;
  step?: string;
}

export interface LogActivityAttemptResult {
  orderId: string;
  activityName: string;
  status: 'STARTED' | 'SUCCEEDED' | 'FAILED';
  loggedAt: string;
  errorMessage: string | null;
  step: string | undefined;
  success: true;
}

export async function logActivityAttempt(input: LogActivityAttemptInput): Promise<LogActivityAttemptResult> {
  const db = getPool();
  const loggedAt = new Date().toISOString();
  await db.query(
    `INSERT INTO workflow_activity_log (order_id, activity_name, status, error_message, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [input.orderId, input.activityName, input.status, input.errorMessage ?? null]
  );
  return {
    orderId: input.orderId,
    activityName: input.activityName,
    status: input.status,
    loggedAt,
    errorMessage: input.errorMessage ?? null,
    step: input.step,
    success: true
  };
}

