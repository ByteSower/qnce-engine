import React from 'react';

interface StateDebugOverlayProps {
  nodeId: string;
  flags: Record<string, any>;
  history: string[];
  className?: string;
}

const StateDebugOverlay: React.FC<StateDebugOverlayProps> = ({ nodeId, flags, history, className = '' }) => (
  <div className={`fixed top-4 right-4 bg-black bg-opacity-50 text-xs text-white p-2 rounded-md border border-gray-700 z-50 max-w-xs shadow transition-opacity ${className}`}>
    <div className="font-bold mb-1">[Debug] QNCE State</div>
    <div><span className="font-semibold">Node:</span> {nodeId}</div>
    <div className="font-semibold mt-1">Flags:</div>
    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(flags, null, 2)}</pre>
    <div className="font-semibold mt-1">History:</div>
    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(history)}</pre>
  </div>
);

export default StateDebugOverlay;
