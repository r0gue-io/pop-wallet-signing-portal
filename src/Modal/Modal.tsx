interface ModalProps {
  isOpen: boolean; // Controls whether the modal is shown
  title: string; // Title of the modal
  message: string; // Message or content inside the modal
  onConfirm?: () => void; // Optional confirm action
  onCancel?: () => void; // Optional cancel action
  confirmText?: string; // Text for the confirm button
  cancelText?: string; // Text for the cancel button
  showCancelButton?: boolean; // Whether to show a cancel button
}

export const Modal: React.FC<ModalProps> = ({
                                              isOpen,
                                              title,
                                              message,
                                              onConfirm,
                                              onCancel,
                                              confirmText = "Confirm",
                                              cancelText = "Cancel",
                                              showCancelButton = true,
                                            }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <h2 className="text-lg font-medium text-center mb-4">{title}</h2>
        <p className="text-sm text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          {showCancelButton && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
