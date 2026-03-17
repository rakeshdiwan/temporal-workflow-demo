import { Router, Request, Response, NextFunction } from 'express';
import { getTemporalClient } from '../temporal/client';
import { v4 as uuid } from 'uuid';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerName, simulateFailureSteps } = req.body ?? {};
    if (!customerName) {
      res.status(400).json({ error: 'customerName is required' });
      return;
    }
    const orderId = uuid();
    const client = await getTemporalClient();

    const workflowId = `order-${orderId}`;
    const handle = await client.workflow.start('orderWorkflow', {
      args: [
        {
          orderId,
          customerName,
          simulateFailureSteps
        }
      ],
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'orders-task-queue',
      workflowId
    });

    res.status(201).json({
      orderId,
      workflowId: handle.workflowId
    });
    return;
  } catch (err) {
    next(err);
  }
});

function signalRoute(
  signalName: string,
  payloadKey?: string
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        res.status(400).json({ error: 'orderId path param is required' });
        return;
      }
      const workflowId = `order-${orderId}`;
      const client = await getTemporalClient();
      const handle = client.workflow.getHandle(workflowId);

      if (payloadKey) {
        const payload = req.body ?? {};
        await handle.signal(signalName, payload);
      } else {
        await handle.signal(signalName);
      }

      res.status(202).json({ workflowId });
      return;
    } catch (err) {
      next(err);
    }
  };
}

router.post('/:orderId/approve', signalRoute('approveOrder'));
router.post('/:orderId/assign-driver', signalRoute('assignDriver', 'driverId'));
router.post('/:orderId/driver-accept', signalRoute('driverAccept'));
router.post('/:orderId/pickup', signalRoute('pickup'));
router.post('/:orderId/deliver', signalRoute('deliver'));
router.post('/:orderId/cancel', signalRoute('cancelOrder'));

export default router;

