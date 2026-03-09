import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import ConfirmationDialog from "../confirmation-dialog";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import ManufacturerDetailsForm from "./manufacturer-details-form";

interface EditManufacturerButtonProps extends Omit<React.ComponentProps<typeof ManufacturerDetailsForm>, "onDirtyChange"> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditManufacturerButton({
  manufacturer,
  trigger,
  onSubmitted,
  open: openProp,
  onOpenChange,
  ...passThroughProps
}: EditManufacturerButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDirtyRef = useRef(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isDirtyRef.current) {
        setConfirmOpen(true);
        return;
      }
      onOpenChange ? onOpenChange(nextOpen) : setOpen(nextOpen);
    },
    [onOpenChange]
  );

  const forceClose = useCallback(() => {
    setConfirmOpen(false);
    onOpenChange ? onOpenChange(false) : setOpen(false);
  }, [onOpenChange]);

  return (
    <>
      <ResponsiveModal
        open={openProp ?? open}
        onOpenChange={handleOpenChange}
        isNested
      >
        <ResponsiveModalTrigger>
          {trigger !== undefined ? (
            trigger
          ) : (
            <Button type="button" size="sm">
              {manufacturer ? <Pencil /> : <Plus />}
              {manufacturer ? "Edit" : "Add"} Manufacturer
            </Button>
          )}
        </ResponsiveModalTrigger>
        <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>
              {manufacturer ? "Edit Manufacturer" : "Add New Manufacturer"}
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <ManufacturerDetailsForm
            onSubmitted={() => {
              isDirtyRef.current = false;
              onOpenChange ? onOpenChange(false) : setOpen(false);
              onSubmitted?.();
            }}
            onDirtyChange={(dirty) => {
              isDirtyRef.current = dirty;
            }}
            manufacturer={manufacturer}
            {...passThroughProps}
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
