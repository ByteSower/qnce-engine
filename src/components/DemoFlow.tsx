import React, { useState } from 'react';
import NarrativeDisplay from './NarrativeDisplay';
import ChoiceSelector from './ChoiceSelector';
import StateDebugOverlay from './StateDebugOverlay';
import IntroModal from './IntroModal';
import FeedbackSection from './FeedbackSection';
import AboutSection from './AboutSection';
import TutorialOverlay from './TutorialOverlay';
import { useQNCE } from '../hooks/useQNCE';
import LogArea from './LogArea';
import type { LogEntry } from './LogArea';

const DemoFlow: React.FC = () => {
  const { currentNode, flags, history, selectChoice, resetNarrative } = useQNCE();
  const [showDebug, setShowDebug] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false); // Only show after intro
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Show tutorial after intro modal is closed
  function handleIntroClose() {
    setShowModal(false);
    setShowTutorial(true);
  }

  // Enhanced decision logic for good/bad branches
  function handleSelectChoice(choice: any) {
    // Good outcome nodes
    const goodNodes = ['campfire', 'merchant', 'signal', 'welcome', 'shortcut'];
    // Bad outcome nodes
    const badNodes = ['lost'];
    selectChoice(choice);
    if (goodNodes.includes(choice.nextNodeId)) {
      setLogs(logs => [
        ...logs,
        { message: 'Branch Good: Favorable narrative shift achieved!', type: 'good' },
      ]);
      // Also log to console
      // eslint-disable-next-line no-console
      console.log("%cBranch Good: Favorable narrative shift achieved!", "color: green; font-weight: bold;");
    } else if (badNodes.includes(choice.nextNodeId)) {
      setLogs(logs => [
        ...logs,
        { message: 'Branch Bad: Narrative collapse warning triggered!', type: 'bad' },
      ]);
      // eslint-disable-next-line no-console
      console.log("%cBranch Bad: Narrative collapse warning triggered!", "color: red; font-weight: bold;");
    }
  }

  return (
    <>
      {showModal && <IntroModal onClose={handleIntroClose} />}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      <div className="w-full flex flex-col items-center text-white">
        <div className="w-full max-w-md mx-auto px-2 sm:px-4 text-center">
          {/* Narrative, choices, and log area grouped for cohesion */}
          <div className="flex flex-col items-center w-full">
            <div className="mb-4 w-full">
              <NarrativeDisplay text={currentNode.text} />
            </div>
            <div className="flex flex-col items-center mb-2 w-full">
              <ChoiceSelector choices={currentNode.choices} onSelect={handleSelectChoice} />
            </div>
            <div className="w-full mt-2 mb-4 px-2">
              <LogArea logs={logs} />
            </div>
            <div className="flex items-center gap-4 mt-2 w-full max-w-md justify-center">
              <button
                className="text-xs text-blue-200 underline hover:text-blue-400 transition"
                onClick={resetNarrative}
              >
                Restart Demo
              </button>
              <button
                className="text-xs text-gray-300 underline ml-auto hover:text-blue-400 transition"
                onClick={() => setShowDebug((v) => !v)}
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
              <button
                className="text-xs text-yellow-300 underline ml-auto hover:text-yellow-500 transition"
                onClick={() => setShowTutorial(true)}
              >
                Tutorial
              </button>
            </div>
            {showDebug && (
              <StateDebugOverlay nodeId={currentNode.id} flags={flags} history={history} />
            )}
            <AboutSection />
          </div>
          <FeedbackSection />
        </div>
      </div>
    </>
  );
};

export default DemoFlow;
