import React, { useState } from 'react';
import NarrativeDisplay from './NarrativeDisplay';
import ChoiceSelector from './ChoiceSelector';
import StateDebugOverlay from './StateDebugOverlay';
import { useQNCE } from '../hooks/useQNCE';

const DemoFlow: React.FC = () => {
  const { currentNode, flags, history, selectChoice, resetNarrative } = useQNCE();
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="relative">
      <NarrativeDisplay text={currentNode.text} />
      <ChoiceSelector choices={currentNode.choices} onSelect={selectChoice} />
      <div className="flex items-center gap-4 mt-4">
        <button
          className="text-xs text-blue-700 underline"
          onClick={resetNarrative}
        >
          Restart Demo
        </button>
        <button
          className="text-xs text-gray-600 underline ml-auto hover:text-blue-700 transition"
          onClick={() => setShowDebug((v) => !v)}
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      {showDebug && (
        <StateDebugOverlay nodeId={currentNode.id} flags={flags} history={history} />
      )}
    </div>
  );
};

export default DemoFlow;
