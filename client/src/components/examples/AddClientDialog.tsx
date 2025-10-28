import { AddClientDialog } from "../AddClientDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

export default function AddClientDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="p-8">
        <Button onClick={() => setOpen(true)} data-testid="button-open-dialog">
          Open Add Client Dialog
        </Button>
        <AddClientDialog
          open={open}
          onOpenChange={setOpen}
          onSubmit={(data) => console.log('Client submitted:', data)}
        />
      </div>
      <Toaster />
    </>
  );
}
