import { Button } from "@/components/ui/button.tsx"

interface ModalProps {
  isOpen: boolean; // Controls whether the modal is shown
  title: string; // Title of the modal
  message: string; // Message or content inside the modal
  onConfirm?: () => void; // Optional confirm action
  onCancel?: () => void; // Optional cancel action
  confirmText?: string; // Text for the confirm button
  cancelText?: string; // Text for the cancel button
  confirmClass?: string;
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
                                              confirmClass= "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600",
                                              showCancelButton = true,
                                            }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-lg w-96 p-6" onClick={(e) => e.stopPropagation() /* Prevents close when clicking inside modal. */ } >
        <h2 className="text-lg font-medium text-center mb-4">{title}</h2>
        <p className="text-sm text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          {showCancelButton && (
            <Button
              onClick={onCancel}
              className="px-4 py-2 bg-violet-950 rounded hover:bg-violet-800"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            className={confirmClass}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
