import React from 'react';
import type { Choice } from '../hooks/useQNCE';

interface ChoiceSelectorProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
}

const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({ choices, onSelect }) => (
  <div className="flex flex-col gap-3 mt-4 items-center w-full">
    {choices.map((choice, idx) => (
      <button
        key={idx}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-md text-lg font-semibold"
        onClick={() => onSelect(choice)}
        tabIndex={0}
      >
        {choice.text}
      </button>
    ))}
  </div>
);

export default ChoiceSelector;
