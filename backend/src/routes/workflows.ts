import { Router, Request, Response, NextFunction } from 'express';
import { getTemporalClient } from '../temporal/client';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await getTemporalClient();
    const pageSize = 20;
    const executions: any[] = [];
    const iterator = (client as any).workflow.list({ pageSize });
    for await (const exec of iterator) {
      executions.push(exec);
      if (executions.length >= pageSize) break;
    }
    return res.json(
      executions.map((e) => {
        const info = e as any;
        return {
          workflowId: info.execution?.workflowId ?? info.workflowId,
          runId: info.execution?.runId ?? info.runId,
          type: info.type?.name ?? info.type,
          status: info.status,
          startTime: info.startTime,
          closeTime: info.closeTime
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:workflowId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflowId = String(req.params.workflowId);
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    const [state, progress, failureInfo] = await Promise.all([
      handle.query('getCurrentState'),
      handle.query('getProgress'),
      handle.query('getFailureInfo')
    ]);

    let versionInfo: any = null;
    try {
      versionInfo = await handle.query('getVersionInfo');
    } catch {
      versionInfo = null;
    }

    res.json({
      workflowId,
      state,
      progress,
      failureInfo,
      versionInfo
    });
    return;
  } catch (err) {
    next(err);
  }
});

router.get('/:workflowId/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflowId = String(req.params.workflowId);
    const client = await getTemporalClient();
    const service = (client as any).connection?.service ?? (client as any).service;
    const historyResponse = await service.getWorkflowExecutionHistory({
      namespace: 'default',
      execution: { workflowId },
      maximumPageSize: 100
    });
    res.json(historyResponse.history);
    return;
  } catch (err) {
    next(err);
  }
});

export default router;

