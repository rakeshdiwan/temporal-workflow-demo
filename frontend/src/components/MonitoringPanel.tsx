import React, { useEffect, useState } from 'react';
import { listWorkflows, getWorkflowStatus, getWorkflowHistory } from '../api/client';

interface Props {
  selectedWorkflowId?: string;
}

const MonitoringPanel: React.FC<Props> = ({ selectedWorkflowId }) => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [status, setStatus] = useState<any | null>(null);
  const [history, setHistory] = useState<any | null>(null);

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    if (selectedWorkflowId) {
      refreshDetails(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  const refreshList = async () => {
    //const data = await listWorkflows();
    //setWorkflows(data);
  };

  const refreshDetails = async (workflowId: string) => {
    const [s, h] = await Promise.all([getWorkflowStatus(workflowId), getWorkflowHistory(workflowId)]);
    setStatus(s);
    setHistory(h);
  };

  return (
    <div>
      <h2>Monitoring</h2>
      <button onClick={refreshList}>Refresh Workflows</button>
      <ul>
        {workflows.map((w) => (
          <li key={w.runId}>
            {w.workflowId} - {w.status}
          </li>
        ))}
      </ul>

      {status && (
        <div>
          <h3>Selected Workflow Status</h3>
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>
      )}

      {history && (
        <div>
          <h3>History (raw from Temporal)</h3>
          <pre style={{ maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(history, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MonitoringPanel;

