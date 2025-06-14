import React from 'react';
import type { Choice } from '../hooks/useQNCE';

interface ChoiceSelectorProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
}

const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({ choices, onSelect }) => (
  <div className="flex flex-col gap-2 mt-2">
    {choices.map((choice, idx) => (
      <button
        key={idx}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold shadow hover:bg-blue-700 focus:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 w-full"
        onClick={() => onSelect(choice)}
        tabIndex={0}
      >
        {choice.text}
      </button>
    ))}
  </div>
);

export default ChoiceSelector;
