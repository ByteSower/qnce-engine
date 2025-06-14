import React from 'react';

interface StateDebugOverlayProps {
  nodeId: string;
  flags: Record<string, any>;
  history: string[];
  className?: string;
}

const StateDebugOverlay: React.FC<StateDebugOverlayProps> = ({ nodeId, flags, history, className = '' }) => (
  <div className={`fixed bottom-4 right-4 bg-white/80 backdrop-blur text-xs text-gray-800 rounded-lg border border-gray-300 shadow-lg p-3 z-50 max-w-xs transition-opacity ${className}`}>
    <div className="font-bold mb-1">[Debug] QNCE State</div>
    <div><span className="font-semibold">Node:</span> {nodeId}</div>
    <div className="font-semibold mt-1">Flags:</div>
    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(flags, null, 2)}</pre>
    <div className="font-semibold mt-1">History:</div>
    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(history)}</pre>
  </div>
);

export default StateDebugOverlay;
