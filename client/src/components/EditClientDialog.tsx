import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { ServiceBadge, ServiceType } from "./ServiceBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client, InsertClient } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: Partial<InsertClient>) => void;
}

const availableServices: ServiceType[] = ["inwi", "orange", "maroc-telecom", "water", "gas", "electricity"];

export function EditClientDialog({ client, open, onOpenChange, onSubmit }: EditClientDialogProps) {
  const [selectedService, setSelectedService] = useState<ServiceType>("inwi");
  const [newCode, setNewCode] = useState("");

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: client.name,
      phone: client.phone,
      email: client.email,
      codes: client.codes.map(c => ({ service: c.service as ServiceType, code: c.code })),
    },
  });

  const codes = form.watch("codes") || [];

  useEffect(() => {
    form.reset({
      name: client.name,
      phone: client.phone,
      email: client.email,
      codes: client.codes.map(c => ({ service: c.service as ServiceType, code: c.code })),
    });
  }, [client, form]);

  const handleAddCode = () => {
    if (newCode && !codes.some(c => c.service === selectedService)) {
      form.setValue("codes", [...codes, { service: selectedService, code: newCode }]);
      setNewCode("");
    }
  };

  const handleRemoveCode = (service: ServiceType) => {
    form.setValue("codes", codes.filter(c => c.service !== service));
  };

  const handleFormSubmit = (data: InsertClient) => {
    onSubmit?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                    <FormLabel>Phone Number</FormLabel>
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      data-testid="input-edit-client-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label>Service Codes</Label>
            
              {codes.length > 0 && (
                <div className="space-y-3">
                  {codes.map((codeItem) => (
                    <div key={codeItem.service} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <ServiceBadge service={codeItem.service as ServiceType} />
                      <code className="flex-1 font-mono text-sm">{codeItem.code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveCode(codeItem.service as ServiceType)}
                        data-testid={`button-edit-remove-code-${codeItem.service}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Select value={selectedService} onValueChange={(value) => setSelectedService(value as ServiceType)}>
                  <SelectTrigger className="w-48" data-testid="select-edit-service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service.charAt(0).toUpperCase() + service.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Enter code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="flex-1"
                  data-testid="input-edit-service-code"
                />
                
                <Button onClick={handleAddCode} data-testid="button-edit-add-code">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
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
