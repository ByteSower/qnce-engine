import React from 'react';

const AboutSection = () => (
  <div className="mt-8 py-6 border-t border-gray-700 text-center">
    <h3 className="text-2xl font-bold mb-4">About QNCE</h3>
    <p className="text-gray-300 mb-4">
      QNCE (Quantum Narrative Convergence Engine) is a dynamic narrative engine
      that uses quantum-inspired concepts like superposition, collapse, and entanglement
      to generate adaptive, non-linear story paths. It’s designed to revolutionize narrative design,
      moving beyond static storyboards and generic narrative generators.
    </p>
    <p className="text-gray-300 mb-4">
      Whether you're developing a narrative-driven RPG, an interactive novel, or experimental interactive media,
      QNCE provides a framework to create deeply immersive and ever-changing storytelling experiences.
    </p>
    <p className="text-gray-400 text-sm">
      For complete documentation, source code, and to contribute, please visit our{' '}
      <a
        href="https://github.com/ByteSower/qnce-demo"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
      >
        GitHub repository
      </a>.
    </p>
  </div>
);

export default AboutSection;
