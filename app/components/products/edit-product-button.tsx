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
import ProductDetailsForm, { type ProductDetailsFormProps } from "./product-details-form";

interface EditProductButtonProps extends Omit<ProductDetailsFormProps, "onSubmitted" | "onDirtyChange"> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  nestDrawers?: boolean;
}

export default function EditProductButton({
  product,
  trigger,
  parentProduct,
  consumable,
  open: openProp,
  onOpenChange,
  nestDrawers,
  ...passThroughProps
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDirtyRef = useRef(false);

  const title = `${product ? "Edit" : "Add New"} ${
    consumable || parentProduct ? "Supply" : "Product"
  }`;

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
        isNested={nestDrawers}
      >
        <ResponsiveModalTrigger>
          {trigger !== undefined ? (
            trigger
          ) : (
            <Button type="button" size="sm">
              {product ? <Pencil /> : <Plus />}
              {product ? "Edit" : "Add"} {consumable || parentProduct ? "Supply" : "Product"}
            </Button>
          )}
        </ResponsiveModalTrigger>
        <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{title}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <ProductDetailsForm
            onSubmitted={() => {
              isDirtyRef.current = false;
              onOpenChange ? onOpenChange(false) : setOpen(false);
            }}
            onDirtyChange={(dirty) => {
              isDirtyRef.current = dirty;
            }}
            product={product}
            parentProduct={parentProduct}
            consumable={consumable}
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
