import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
});

export interface OrderStatus {
  workflowId: string;
  state: string;
  progress: any;
  failureInfo: any;
  versionInfo: any;
}

export async function createOrder(customerName: string, simulateFailureSteps?: string[]) {
  const res = await api.post('/orders', { customerName, simulateFailureSteps });
  return res.data as { orderId: string; workflowId: string };
}

export async function sendAction(
  orderId: string,
  action: 'approve' | 'assign-driver' | 'driver-accept' | 'pickup' | 'deliver' | 'cancel',
  payload?: any
) {
  await api.post(`/orders/${orderId}/${action}`, payload);
}

export async function listWorkflows() {
  const res = await api.get('/workflows');
  return res.data as any[];
}

export async function getWorkflowStatus(workflowId: string) {
  const res = await api.get(`/workflows/${workflowId}/status`);
  return res.data as OrderStatus;
}

export async function getWorkflowHistory(workflowId: string) {
  const res = await api.get(`/workflows/${workflowId}/history`);
  return res.data as any;
}

