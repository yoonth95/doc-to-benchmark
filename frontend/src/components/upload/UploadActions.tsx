import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UploadActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  cancelLabel?: string;
  submitLabel?: string;
}

const UploadActions = ({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isSubmitDisabled = false,
  cancelLabel = "취소",
  submitLabel = "문서 처리 시작",
}: UploadActionsProps) => (
  <div className="flex gap-4">
    <Button variant="outline" size="lg" onClick={onCancel} className="flex-1">
      {cancelLabel}
    </Button>
    <Button
      size="lg"
      onClick={onSubmit}
      disabled={isSubmitDisabled}
      className="flex-1 bg-gradient-to-r from-primary to-secondary transition-opacity hover:opacity-90"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          처리 중...
        </>
      ) : (
        submitLabel
      )}
    </Button>
  </div>
);

export default UploadActions;
