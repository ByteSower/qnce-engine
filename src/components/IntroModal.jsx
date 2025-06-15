import React from 'react';

const IntroModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to QNCE Demo</h2>
      <p className="mb-4 text-gray-700">
        QNCE harnesses quantum-inspired storytelling (superposition, collapse,
        entanglement) to deliver a dynamic narrative experience. Enjoy exploring
        unique story paths and provide feedback!
      </p>
      <p className="mb-4 text-sm text-gray-500">
        Developed by [ByteSower]. We’d love to hear your thoughts.
      </p>
      <button 
        onClick={onClose} 
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
      >
        Continue
      </button>
    </div>
  </div>
);

export default IntroModal;
