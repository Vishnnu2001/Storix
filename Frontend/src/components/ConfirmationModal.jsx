import { useEffect } from "react";
import { AlertTriangleIcon, Trash2Icon, InfoIcon, XIcon } from "lucide-react";

/**
 * Centered In-App Confirmation Modal to replace native window.confirm() dialogs.
 */
export default function ConfirmationModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  isLoading = false,
  onConfirm,
  onClose,
}) {
  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2Icon className="size-6 text-error" />,
          iconBg: "bg-error/15 text-error",
          btnClass: "btn btn-error text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangleIcon className="size-6 text-warning" />,
          iconBg: "bg-warning/15 text-warning",
          btnClass: "btn btn-warning text-warning-content",
        };
      default:
        return {
          icon: <InfoIcon className="size-6 text-primary" />,
          iconBg: "bg-primary/15 text-primary",
          btnClass: "btn btn-primary text-primary-content",
        };
    }
  };

  const { icon, iconBg, btnClass } = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Dark Semi-Transparent Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Centered Modal Content Card */}
      <div className="relative bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 text-left z-10 transition-all">
        {/* Close Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-xs absolute right-4 top-4 text-base-content/50 hover:text-base-content"
          aria-label="Close modal"
        >
          <XIcon className="size-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1 pt-1">
            <h3 className="text-lg font-bold text-base-content leading-tight">
              {title}
            </h3>
            <p className="text-sm text-base-content/70 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-base-content/10">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="btn btn-ghost btn-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`btn btn-sm ${btnClass}`}
          >
            {isLoading && <span className="loading loading-spinner loading-xs mr-1" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
