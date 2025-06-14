import React, { useEffect, useState } from 'react';

interface NarrativeDisplayProps {
  text: string;
}

const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const timeout = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div className={`bg-white text-gray-900 rounded-lg shadow p-6 mb-4 min-h-[120px] transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="text-lg leading-relaxed font-medium">{text}</p>
    </div>
  );
};

export default NarrativeDisplay;
