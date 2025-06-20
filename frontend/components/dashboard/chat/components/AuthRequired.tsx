import React from 'react';

interface AuthRequiredProps {
  onClose: () => void;
}

export const AuthRequired: React.FC<AuthRequiredProps> = ({ onClose }) => (
  <div className="w-96 h-full bg-black/80 border-l border-white/10 flex flex-col items-center justify-center">
    <div className="text-center p-6">
      <h3 className="text-white text-lg font-semibold mb-2">Authentication Required</h3>
      <p className="text-gray-400 text-sm mb-4">
        Please sign in to start generating workflows and save your conversation history.
      </p>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);
