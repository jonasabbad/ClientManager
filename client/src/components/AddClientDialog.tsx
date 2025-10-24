import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { ServiceBadge, ServiceType } from "./ServiceBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
}

const availableServices: ServiceType[] = ["inwi", "orange", "maroc-telecom", "water", "gas", "electricity"];

export function AddClientDialog({ open, onOpenChange, onSubmit }: AddClientDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [codes, setCodes] = useState<{ service: ServiceType; code: string }[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceType>("inwi");
  const [newCode, setNewCode] = useState("");

  const handleAddCode = () => {
    if (newCode && !codes.some(c => c.service === selectedService)) {
      setCodes([...codes, { service: selectedService, code: newCode }]);
      setNewCode("");
      console.log('Added code:', selectedService, newCode);
    }
  };

  const handleRemoveCode = (service: ServiceType) => {
    setCodes(codes.filter(c => c.service !== service));
    console.log('Removed code for service:', service);
  };

  const handleSubmit = () => {
    const clientData = { name, phone, email, codes };
    console.log('Client data submitted:', clientData);
    onSubmit?.(clientData);
    setName("");
    setPhone("");
    setEmail("");
    setCodes([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-client-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+212 6XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-client-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-client-email"
            />
          </div>

          <div className="space-y-4">
            <Label>Service Codes</Label>
            
            {codes.length > 0 && (
              <div className="space-y-3">
                {codes.map((codeItem) => (
                  <div key={codeItem.service} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <ServiceBadge service={codeItem.service} />
                    <code className="flex-1 font-mono text-sm">{codeItem.code}</code>
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
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Select value={selectedService} onValueChange={(value) => setSelectedService(value as ServiceType)}>
                <SelectTrigger className="w-48" data-testid="select-service">
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
                data-testid="input-service-code"
              />
              
              <Button onClick={handleAddCode} data-testid="button-add-code">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSubmit} data-testid="button-save-client">
            Save Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
