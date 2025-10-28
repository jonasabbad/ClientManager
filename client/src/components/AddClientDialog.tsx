import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { ServiceBadge, ServiceType } from "./ServiceBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import type { InsertClient, ServiceCodeConfig } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { firestoreService } from "@/lib/firestoreService";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

export function AddClientDialog({ open, onOpenChange, onSubmit }: AddClientDialogProps) {
  const { data: serviceCodes = [] } = useQuery<ServiceCodeConfig[]>({
    queryKey: ["service-codes"],
    queryFn: () => firestoreService.getAllServiceCodes(),
  });

  const availableServices = serviceCodes.filter(sc => sc.isActive === 1);
  const [selectedService, setSelectedService] = useState<string>(availableServices[0]?.serviceId || "");
  const [newCode, setNewCode] = useState({
    code: "",
    accountHolderName: "",
    address: "",
    phoneNumber: "",
  });

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      phone: "",
      codes: [],
    },
  });

  const codes = form.watch("codes") || [];

  const handleAddCode = () => {
    const trimmedCode = newCode.code.trim();
    const trimmedAccountHolder = newCode.accountHolderName.trim();
    const trimmedAddress = newCode.address.trim();
    const trimmedPhone = newCode.phoneNumber.trim();

    if (selectedService && trimmedCode && trimmedAccountHolder && !codes.some(c => c.service === selectedService)) {
      const codeEntry: InsertClient["codes"][number] = {
        service: selectedService,
        code: trimmedCode,
        accountHolderName: trimmedAccountHolder,
      };

      if (trimmedAddress) {
        codeEntry.address = trimmedAddress;
      }

      if (trimmedPhone) {
        codeEntry.phoneNumber = trimmedPhone;
      }

      form.setValue("codes", [
        ...codes,
        codeEntry,
      ]);
      setNewCode({
        code: "",
        accountHolderName: "",
        address: "",
        phoneNumber: "",
      });
    }
  };

  const handleRemoveCode = (service: string) => {
    form.setValue("codes", codes.filter(c => c.service !== service));
  };

  const handleFormSubmit = (data: InsertClient) => {
    onSubmit?.(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
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
                        data-testid="input-client-name"
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+212 6XX XXX XXX"
                        {...field}
                        data-testid="input-client-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <Label>Service Codes</Label>
            
              {codes.length > 0 && (
                <div className="space-y-3">
                  {codes.map((codeItem) => (
                    <Card key={codeItem.service} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <ServiceBadge service={codeItem.service} />
                            <code className="font-mono text-sm font-medium">{codeItem.code}</code>
                          </div>
                          <div className="text-sm space-y-1">
                            <div><span className="text-muted-foreground">Account Holder:</span> {codeItem.accountHolderName}</div>
                            {codeItem.address && (
                              <div><span className="text-muted-foreground">Address:</span> {codeItem.address}</div>
                            )}
                            {codeItem.phoneNumber && (
                              <div><span className="text-muted-foreground">Phone:</span> {codeItem.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveCode(codeItem.service)}
                          data-testid={`button-remove-code-${codeItem.service}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>Service Type</Label>
                    <Select value={selectedService} onValueChange={(value) => setSelectedService(value)}>
                      <SelectTrigger className="w-full mt-1" data-testid="select-service">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((service) => (
                          <SelectItem key={service.serviceId} value={service.serviceId}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Service Code *</Label>
                      <Input
                        placeholder="Enter code"
                        value={newCode.code}
                        onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                        className="mt-1"
                        data-testid="input-service-code"
                      />
                    </div>
                    
                    <div>
                      <Label>Account Holder Name *</Label>
                      <Input
                        placeholder="Full name"
                        value={newCode.accountHolderName}
                        onChange={(e) => setNewCode({...newCode, accountHolderName: e.target.value})}
                        className="mt-1"
                        data-testid="input-account-holder-name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Address (Optional)</Label>
                      <Input
                        placeholder="Street address"
                        value={newCode.address}
                        onChange={(e) => setNewCode({...newCode, address: e.target.value})}
                        className="mt-1"
                        data-testid="input-code-address"
                      />
                    </div>
                    
                    <div>
                      <Label>Phone Number (Optional)</Label>
                      <Input
                        placeholder="+212 6XX XXX XXX"
                        value={newCode.phoneNumber}
                        onChange={(e) => setNewCode({...newCode, phoneNumber: e.target.value})}
                        className="mt-1"
                        data-testid="input-code-phone"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={handleAddCode} 
                  className="w-full"
                  data-testid="button-add-code"
                  disabled={!newCode.code || !newCode.accountHolderName}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service Code
                </Button>
              </Card>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-client">
                Save Client
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
