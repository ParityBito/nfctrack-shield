import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmationDialog from "../../confirmation-dialog";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../../responsive-modal";
import type { AssetQuestionDetailFormProps } from "./asset-question-detail-form.component";
import AssetQuestionDetailForm from "./asset-question-detail-form.component";

interface NewAssetQuestionButtonProps extends Omit<AssetQuestionDetailFormProps, "onDirtyChange"> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditAssetQuestionButton({
  trigger,
  open: openProp,
  onOpenChange,
  ...passthroughProps
}: NewAssetQuestionButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDirtyRef = useRef(false);

  const open = openProp ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  useEffect(() => {
    onOpenChange?.(internalOpen);
  }, [internalOpen, onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isDirtyRef.current) {
        setConfirmOpen(true);
        return;
      }
      setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange]
  );

  const forceClose = useCallback(() => {
    setConfirmOpen(false);
    setInternalOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={handleOpenChange}
        isNested
      >
        <ResponsiveModalTrigger>
          {trigger !== undefined ? (
            trigger
          ) : (
            <Button type="button" size="sm">
              {passthroughProps.assetQuestion ? <Pencil /> : <Plus />}
              {passthroughProps.assetQuestion ? "Edit" : "Add"} Question
            </Button>
          )}
        </ResponsiveModalTrigger>
        <ResponsiveModalContent classNames={{ dialog: "sm:max-w-5xl p-0" }}>
          <ResponsiveModalHeader className="px-4 pt-4">
            <ResponsiveModalTitle>
              {passthroughProps.assetQuestion ? "Edit Question" : "Add New Question"}
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <AssetQuestionDetailForm
            onSubmitted={() => {
              isDirtyRef.current = false;
              setOpen(false);
              passthroughProps.onSubmitted?.();
            }}
            onDirtyChange={(dirty) => {
              isDirtyRef.current = dirty;
            }}
            {...passthroughProps}
          />
        </ResponsiveModalContent>
      </ResponsiveModal>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Unsaved changes"
        message="You have unsaved changes. Are you sure you want to close?"
        confirmText="Discard"
        destructive
        onConfirm={forceClose}
      />
    </>
  );
}
