import React from 'react';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
    <div className="max-w-3xl w-full mx-auto bg-white p-6 rounded-lg shadow-lg text-left">
      <h2 className="text-3xl font-bold mb-4">Welcome to the QNCE Walkthrough</h2>
      <p className="mb-2">
        In this demo, your choices influence a dynamic narrative influenced by quantum-inspired logic.
      </p>
      <ul className="list-disc pl-6 mb-4 text-left">
        <li><strong>Narrative Text:</strong> Displays the evolving story.</li>
        <li><strong>Choice Buttons:</strong> Determine your path through the narrative.</li>
        <li>
          <strong>Debug Log:</strong> Shows state changes— <span className="whitespace-nowrap !text-red-600 font-bold text-sm" style={{ fontSize: '0.875rem' }}>red: Warning or negative shift</span>, <span className="text-green-600 font-bold whitespace-nowrap text-sm" style={{ fontSize: '0.875rem' }}>green: Favorable outcome</span>.
        </li>
      </ul>
      <p className="mb-4">
        Interact with the branches to see how different decisions impact the narrative. Feel free to review the log for details on the underlying mechanics!
      </p>
      <button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 focus:outline-none">
        Got it, proceed!
      </button>
    </div>
  </div>
);

export default TutorialOverlay;
