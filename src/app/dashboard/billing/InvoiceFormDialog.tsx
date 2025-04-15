import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { GenerateInvoiceForm } from "./GenerateInvoiceForm";
import { type RouterOutputs } from "~/trpc/shared";

type Organization = RouterOutputs["organization"]["getAll"][number];

interface InvoiceFormDialogProps {
  organizations: Organization[];
  trigger?: React.ReactNode;
}

export function InvoiceFormDialog({
  organizations,
  trigger,
}: InvoiceFormDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default" size="sm">
            Generate Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>
        <GenerateInvoiceForm organizations={organizations} />
      </DialogContent>
    </Dialog>
  );
}
