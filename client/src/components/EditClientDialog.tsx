import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { ServiceBadge, ServiceType } from "./ServiceBadge";
import type { InsertClient, ServiceCodeConfig } from "@shared/schema";
import type { FirestoreClient } from "@/lib/firestoreService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { firestoreService } from "@/lib/firestoreService";

interface EditClientDialogProps {
  client: FirestoreClient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: Partial<InsertClient>) => void;
}

export function EditClientDialog({ client, open, onOpenChange, onSubmit }: EditClientDialogProps) {
  const { data: serviceCodes = [] } = useQuery<ServiceCodeConfig[]>({
    queryKey: ["service-codes"],
    queryFn: () => firestoreService.getAllServiceCodes(),
  });

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: client.name,
      phone: client.phone ?? "",
      codes: client.codes.map(c => ({
        service: c.service as ServiceType,
        code: c.code,
        accountHolderName: c.accountHolderName || "",
        address: c.address || "",
        phoneNumber: c.phoneNumber || "",
      })),
    },
  });

  const codes = form.watch("codes") || [];

  useEffect(() => {
    form.reset({
      name: client.name,
      phone: client.phone ?? "",
      codes: client.codes.map(c => ({
        service: c.service as ServiceType,
        code: c.code,
        accountHolderName: c.accountHolderName || "",
        address: c.address || "",
        phoneNumber: c.phoneNumber || "",
      })),
    });
  }, [client, form]);

  const handleRemoveCode = (service: string) => {
    form.setValue("codes", codes.filter(c => c.service !== service));
  };

  const handleFormSubmit = (data: InsertClient) => {
    const sanitizedName = data.name.trim();
    const sanitizedPhone = data.phone?.trim();
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
      phone: sanitizedPhone ? sanitizedPhone : undefined,
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

            <div className="space-y-4">
              <Label>Service Codes</Label>

              {codes.length > 0 ? (
                <div className="space-y-3">
                  {codes.map((codeItem, index) => (
                    <Card key={`${codeItem.service}-${index}`} className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ServiceBadge service={codeItem.service as ServiceType} />
                          <span className="text-sm text-muted-foreground">
                            {serviceCodes.find(sc => sc.serviceId === codeItem.service)?.name || codeItem.service}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveCode(codeItem.service)}
                          data-testid={`button-edit-remove-code-${codeItem.service}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`codes.${index}.code` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Code *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter code"
                                  {...field}
                                  data-testid={`input-edit-service-code-${codeItem.service}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`codes.${index}.accountHolderName` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Holder Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Full name"
                                  {...field}
                                  data-testid={`input-edit-account-holder-name-${codeItem.service}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`codes.${index}.address` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Street address"
                                  {...field}
                                  data-testid={`input-edit-code-address-${codeItem.service}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`codes.${index}.phoneNumber` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+212 6XX XXX XXX"
                                  {...field}
                                  data-testid={`input-edit-code-phone-${codeItem.service}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No service codes available for this client.
                </p>
              )}
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
