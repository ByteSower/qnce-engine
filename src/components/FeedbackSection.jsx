import React from 'react';

const FeedbackSection = () => (
  <div className="w-full mt-8 py-4 border-t border-gray-700 text-center">
    <p className="text-sm text-gray-300">
      Have feedback or found an issue?{' '}
      <a
        href="https://github.com/ByteSower/qnce-demo/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
      >
        Let us know on GitHub!
      </a>
    </p>
  </div>
);

export default FeedbackSection;
