import { ShieldPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "~/components/responsive-modal";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import CreateAssetAssistant from "./create-asset-assistant.component";

interface Props {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  clientId?: string;
  siteId?: string;
  nestDrawers?: boolean;
  dialogClassName?: string;
}

export default function CreateAssetButton({
  trigger,
  open: openProp,
  onOpenChange,
  clientId,
  siteId,
  nestDrawers,
  dialogClassName,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen} isNested={nestDrawers}>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            <ShieldPlus /> Add Asset
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: cn("sm:max-w-2xl", dialogClassName) }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            <div className="flex items-center gap-1">
              <ShieldPlus className="size-5" /> Adding new asset...
            </div>
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>{""}</ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <ResponsiveModalBody disableScrollArea className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden sm:h-128 sm:flex-initial">
            <CreateAssetAssistant
              onClose={() => setOpen(false)}
              state={{ assetData: { clientId, siteId } }}
            />
          </div>
        </ResponsiveModalBody>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
