import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Printer, Plus } from "lucide-react";
import { ServiceBadge, ServiceType } from "@/components/ServiceBadge";
import { CodeDisplay } from "@/components/CodeDisplay";
import { EditClientDialog } from "@/components/EditClientDialog";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client, InsertClient, ServiceCode } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newCode, setNewCode] = useState<{
    code: string;
    service: ServiceCode["service"] | "";
    accountHolderName: string;
    address: string;
    phoneNumber: string;
  }>({
    code: "",
    service: "",
    accountHolderName: "",
    address: "",
    phoneNumber: "",
  });

  const clientId = params?.id ? parseInt(params.id) : null;

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
    enabled: !!clientId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertClient> }) => {
      const res = await apiRequest("PATCH", `/api/clients/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Success", description: "Client updated successfully" });
      setIsEditOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Success", description: "Client deleted successfully" });
      navigate("/clients");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const addCodeMutation = useMutation({
    mutationFn: async (codeData: ServiceCode) => {
      if (!client) throw new Error("No client");
      const updatedCodes = [...client.codes, codeData];
      const res = await apiRequest("PATCH", `/api/clients/${client.id}`, { codes: updatedCodes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Success", description: "Service code added successfully" });
      setIsQuickAddOpen(false);
      setNewCode({ code: "", service: "", accountHolderName: "", address: "", phoneNumber: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add service code",
        variant: "destructive",
      });
    },
  });

  const handleQuickAdd = () => {
    if (!newCode.code || !newCode.service || !newCode.accountHolderName) {
      toast({
        title: "Error",
        description: "Please fill in code, service type, and account holder name",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize optional fields to undefined instead of empty strings
    const normalizedCode: ServiceCode = {
      code: newCode.code,
      service: newCode.service,
      accountHolderName: newCode.accountHolderName,
      address: newCode.address.trim() || undefined,
      phoneNumber: newCode.phoneNumber.trim() || undefined,
    };
    
    addCodeMutation.mutate(normalizedCode);
  };

  const handlePrint80mm = () => {
    if (!client) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Receipt - ${client.name}</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
          }
          body {
            width: 80mm;
            margin: 0;
            padding: 10mm;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .title { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
          .section { margin-bottom: 15px; }
          .label { font-weight: bold; margin-bottom: 3px; }
          .value { margin-left: 5px; }
          .code-block { background: #f5f5f5; padding: 5px; margin: 5px 0; border: 1px solid #ddd; }
          .service-name { font-weight: bold; text-transform: uppercase; }
          .code-value { font-family: 'Courier New', monospace; word-break: break-all; }
          .footer { text-align: center; margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; font-size: 9pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CLIENT RECEIPT</div>
          <div>${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="section">
          <div class="label">Client Name:</div>
          <div class="value">${client.name}</div>
        </div>
        
        <div class="section">
          <div class="label">Phone:</div>
          <div class="value">${client.phone}</div>
        </div>
        
        <div class="section">
          <div class="label">Email:</div>
          <div class="value">${client.email}</div>
        </div>
        
        <div class="section">
          <div class="label">Service Codes:</div>
          ${client.codes.map(code => `
            <div class="code-block">
              <div class="service-name">${code.service.replace('-', ' ')}</div>
              <div class="code-value">${code.code}</div>
              <div style="margin-top: 5px; font-size: 9pt;">
                <strong>Holder:</strong> ${code.accountHolderName || 'N/A'}
              </div>
              ${code.address ? `<div style="font-size: 9pt;"><strong>Address:</strong> ${code.address}</div>` : ''}
              ${code.phoneNumber ? `<div style="font-size: 9pt;"><strong>Phone:</strong> ${code.phoneNumber}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          Thank you for your business
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrintA4 = () => {
    if (!client) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print - ${client.name}</title>
        <style>
          @media print {
            @page { size: A4; margin: 20mm; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #333;
          }
          .title { font-size: 24pt; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 12pt; color: #666; }
          .section {
            margin-bottom: 25px;
          }
          .label {
            font-weight: bold;
            font-size: 11pt;
            color: #555;
            margin-bottom: 5px;
          }
          .value {
            font-size: 12pt;
            padding: 10px;
            background: #f9f9f9;
            border-left: 4px solid #007bff;
          }
          .codes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 10px;
          }
          .code-card {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            background: #fafafa;
          }
          .service-name {
            font-weight: bold;
            font-size: 11pt;
            color: #007bff;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .code-value {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background: white;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            word-break: break-all;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            font-size: 10pt;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Client Information</div>
          <div class="subtitle">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="section">
          <div class="label">Client Name</div>
          <div class="value">${client.name}</div>
        </div>
        
        <div class="section">
          <div class="label">Phone Number</div>
          <div class="value">${client.phone}</div>
        </div>
        
        <div class="section">
          <div class="label">Email Address</div>
          <div class="value">${client.email}</div>
        </div>
        
        <div class="section">
          <div class="label">Service Codes (${client.codes.length})</div>
          <div class="codes-grid">
            ${client.codes.map(code => `
              <div class="code-card">
                <div class="service-name">${code.service.replace('-', ' ')}</div>
                <div class="code-value">${code.code}</div>
                <div style="margin-top: 10px; font-size: 10pt; color: #555;">
                  <div><strong>Account Holder:</strong> ${code.accountHolderName || 'N/A'}</div>
                  ${code.address ? `<div><strong>Address:</strong> ${code.address}</div>` : ''}
                  ${code.phoneNumber ? `<div><strong>Phone:</strong> ${code.phoneNumber}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="footer">
          <p>Customer Management System</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-semibold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-semibold">Client Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-semibold">Client Details</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            data-testid="button-edit-client"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handlePrintA4}
            data-testid="button-print-a4"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print A4
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint80mm}
            data-testid="button-print-80mm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print 80mm
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            data-testid="button-delete-client"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Client Name</h3>
            <p className="text-lg font-semibold" data-testid="text-client-name">{client.name}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Phone Number</h3>
            <p className="text-lg" data-testid="text-client-phone">{client.phone}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Email Address</h3>
            <p className="text-lg" data-testid="text-client-email">{client.email}</p>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Service Codes ({client.codes.length})</h2>
          <Button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            size="sm"
            data-testid="button-toggle-quick-add"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Code
          </Button>
        </div>

        {isQuickAddOpen && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-3">Add New Service Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input
                placeholder="Code"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                data-testid="input-quick-code"
              />
              <Select
                value={newCode.service}
                onValueChange={(value) => setNewCode({ ...newCode, service: value as ServiceCode["service"] })}
              >
                <SelectTrigger data-testid="select-quick-service">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inwi">Inwi</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="maroc-telecom">Maroc Telecom</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Full Name"
                value={newCode.accountHolderName}
                onChange={(e) => setNewCode({ ...newCode, accountHolderName: e.target.value })}
                data-testid="input-quick-holder"
              />
              <Input
                placeholder="Address (optional)"
                value={newCode.address}
                onChange={(e) => setNewCode({ ...newCode, address: e.target.value })}
                data-testid="input-quick-address"
              />
              <Input
                placeholder="Phone (optional)"
                value={newCode.phoneNumber}
                onChange={(e) => setNewCode({ ...newCode, phoneNumber: e.target.value })}
                data-testid="input-quick-phone"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleQuickAdd}
                disabled={addCodeMutation.isPending}
                data-testid="button-submit-quick-add"
              >
                {addCodeMutation.isPending ? "Adding..." : "Add Code"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setNewCode({ code: "", service: "", accountHolderName: "", address: "", phoneNumber: "" });
                }}
                data-testid="button-cancel-quick-add"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {client.codes.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-center">No service codes added yet</p>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.codes.map((codeItem, index) => (
                  <TableRow key={`${codeItem.service}-${index}`} data-testid={`row-code-${index}`}>
                    <TableCell className="font-mono" data-testid={`text-code-${index}`}>
                      {codeItem.code}
                    </TableCell>
                    <TableCell data-testid={`text-service-${index}`}>
                      <ServiceBadge service={codeItem.service as ServiceType} />
                    </TableCell>
                    <TableCell data-testid={`text-address-${index}`}>
                      {codeItem.address || "No address"}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-holder-${index}`}>
                      {codeItem.accountHolderName || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-phone-${index}`}>
                      {codeItem.phoneNumber || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {isEditOpen && (
        <EditClientDialog
          client={client}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={(data) => updateMutation.mutate({ id: client.id, data })}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(client.id)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
