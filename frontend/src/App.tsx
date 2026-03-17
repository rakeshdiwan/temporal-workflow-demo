import React, { useState } from 'react';
import OrderActionsPanel from './components/OrderActionsPanel';
import MonitoringPanel from './components/MonitoringPanel';

const App: React.FC = () => {
  const [lastWorkflowId, setLastWorkflowId] = useState<string | undefined>(undefined);

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <div style={{ flex: 1 }}>
        <h1>Temporal Order Workflow Demo</h1>
        <OrderActionsPanel
          onOrderCreated={(_orderId, workflowId) => {
            setLastWorkflowId(workflowId);
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <MonitoringPanel selectedWorkflowId={lastWorkflowId} />
      </div>
    </div>
  );
};

export default App;

