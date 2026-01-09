import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InsertClient } from "@shared/schema";
import type { FirestoreClient } from "@/lib/firestoreService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface EditClientDialogProps {
  client: FirestoreClient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: Partial<InsertClient>) => void;
}

export function EditClientDialog({ client, open, onOpenChange, onSubmit }: EditClientDialogProps) {
  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: client.name,
      phone: client.phone ?? "",
      codes: client.codes.map(c => ({
        service: c.service,
        code: c.code,
        accountHolderName: c.accountHolderName || "",
        address: c.address || "",
        phoneNumber: c.phoneNumber || "",
      })),
    },
  });

  useEffect(() => {
    form.reset({
      name: client.name,
      phone: client.phone ?? "",
      codes: client.codes.map(c => ({
        service: c.service,
        code: c.code,
        accountHolderName: c.accountHolderName || "",
        address: c.address || "",
        phoneNumber: c.phoneNumber || "",
      })),
    });
  }, [client, form]);

  const handleFormSubmit = (data: InsertClient) => {
    const sanitizedName = data.name.trim();
    const rawPhone = form.getValues("phone");
    const sanitizedPhone = rawPhone?.trim();
    const sanitizedCodes = data.codes.map(code => ({
      ...code,
      code: code.code.trim(),
      accountHolderName: code.accountHolderName?.trim() || undefined,
      address: code.address?.trim() || undefined,
      phoneNumber: code.phoneNumber?.trim() || undefined,
    }));

    const payload: Partial<InsertClient> = {
      ...data,
      name: sanitizedName,
      phone: sanitizedPhone === "" ? "" : sanitizedPhone,
      codes: sanitizedCodes,
    };

    onSubmit?.(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        data-testid="input-edit-client-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+212 6XX XXX XXX"
                        {...field}
                        data-testid="input-edit-client-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-edit-cancel"
              >
                Cancel
              </Button>

              <Button type="submit" data-testid="button-save-edit-client">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
