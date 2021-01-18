
import { RecognizeUpdate } from '../../types';
import React from 'react';



import './index.scss';

interface Props {
  lastUpdate: RecognizeUpdate | null;
}

export function LogView({ lastUpdate }: Props) {
  const status = lastUpdate?.status.replace(/^./, (s) => s.toUpperCase());
  const progress = ((lastUpdate?.progress ?? 0) * 100).toFixed(1);

  return (
    <div className="LogView">
      {lastUpdate ? (
        <>
          <span className="LogView-worker">{lastUpdate.workerId}</span>
          <span className="LogView-job">{lastUpdate.jobId}</span>
          <span className="LogView-status">{status}</span>
          <span className="LogView-progress">{`${progress}%`}</span>
        </>
      ) : (
        'Idle'
      )}
    </div>
  );
}
