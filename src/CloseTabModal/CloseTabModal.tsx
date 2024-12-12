import React, { useState } from "react";

interface CloseTabModalProps {
  message: string; // Prop for customizing the modal's message
}

export const CloseTabModal: React.FC<CloseTabModalProps> = ({ message }) => {
  const [isOpen, setIsOpen] = useState(true);

  const closeTab = () => {
    window.close(); // Only works if the tab was programmatically opened
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <h2 className="text-xl font-light text-center mb-4">
          {message}
        </h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={closeTab}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Close Tab
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
