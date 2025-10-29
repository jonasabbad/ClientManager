import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Printer, Plus, Copy } from "lucide-react";
import { ServiceBadge, ServiceType } from "@/components/ServiceBadge";
import { EditClientDialog } from "@/components/EditClientDialog";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client, InsertClient, ServiceCode, ServiceCodeConfig } from "@shared/schema";
import { firestoreService, type FirestoreClient } from "@/lib/firestoreService";
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
import { Badge } from "@/components/ui/badge";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCode, setNewCode] = useState<{
    code: string;
    service: string;
    accountHolderName: string;
    address: string;
    
  }>({
    code: "",
    service: "",
    accountHolderName: "",
    address: "",
    
  });
  const [movedCodes, setMovedCodes] = useState<Set<string>>(() => new Set());
  const clientId = params?.id? parseInt(params.id) : null;

  const { data: client, isLoading } = useQuery<FirestoreClient>({
    queryKey: ["clients", clientId],
    queryFn: async () => {
      const client = await firestoreService.getClient(clientId!);
      if (!client) throw new Error("Client not found");
      return client;
    },
    enabled: !!clientId,
  });

  const { data: serviceCodes = [] } = useQuery<ServiceCodeConfig[]>({
    queryKey: ["service-codes"],
    queryFn: () => firestoreService.getAllServiceCodes(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertClient> }) => {
      return await firestoreService.updateClient(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      return await firestoreService.deleteClient(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      return await firestoreService.updateClient(client.id, { codes: updatedCodes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Success", description: "Service code added successfully" });
      setIsQuickAddOpen(false);
      setNewCode({ code: "", service: "", accountHolderName: "", address: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add service code",
        variant: "destructive",
      });
    },
  });

  const editCodeMutation = useMutation({
    mutationFn: async ({ index, codeData }: { index: number; codeData: ServiceCode }) => {
      if (!client) throw new Error("No client");
      const updatedCodes = [...client.codes];
      updatedCodes[index] = codeData;
      return await firestoreService.updateClient(client.id, { codes: updatedCodes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Success", description: "Service code updated successfully" });
      setEditingIndex(null);
      setNewCode({ code: "", service: "", accountHolderName: "", address: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update service code",
        variant: "destructive",
      });
    },
  });

  const deleteCodeMutation = useMutation({
    mutationFn: async (index: number) => {
      if (!client) throw new Error("No client");
      const updatedCodes = client.codes.filter((_, i) => i !== index);
      return await firestoreService.updateClient(client.id, { codes: updatedCodes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Success", description: "Service code deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete service code",
        variant: "destructive",
      });
    },
  });

  const handleQuickAdd = () => {
    const trimmedCode = newCode.code.trim();
    const trimmedAccountHolder = newCode.accountHolderName.trim();
    const trimmedAddress = newCode.address.trim();
    if (!trimmedCode || !newCode.service) {
      toast({
        title: "Error",
        description: "Please fill in code and service type",
        variant: "destructive",
      });
      return;
    }

    // Normalize optional fields and remove unsupported undefined values
    const normalizedCode: ServiceCode = {
      code: trimmedCode,
      service: newCode.service,
      
    };

   if (trimmedAccountHolder) {
      normalizedCode.accountHolderName = trimmedAccountHolder;
    }

    if (trimmedAddress) {
      normalizedCode.address = trimmedAddress;
    }

    if (editingIndex !== null) {
      editCodeMutation.mutate({ index: editingIndex, codeData: normalizedCode });
    } else {
      addCodeMutation.mutate(normalizedCode);
    }
  };

  const handleStartEdit = (index: number) => {
    if (!client) return;
    const codeToEdit = client.codes[index];
    setNewCode({
      code: codeToEdit.code,
      service: codeToEdit.service,
      accountHolderName: codeToEdit.accountHolderName || "",
      address: codeToEdit.address || "",
      
    });
    setEditingIndex(index);
    setIsQuickAddOpen(true);
  };

  const handleCancelEdit = () => {
    setIsQuickAddOpen(false);
    setEditingIndex(null);
    setNewCode({ code: "", service: "", accountHolderName: "", address: "" });
  };

  const handleCopyCode = async (codeValue: string, serviceValue: string, index: number) => {
    const key = `${serviceValue}-${codeValue}-${index}`;
    try {
      await navigator.clipboard.writeText(codeValue);
      setMovedCodes((prev) => {
        const updated = new Set(prev);
        updated.add(key);
        return updated;
      });
      toast({
        title: "Code copied!",
        description: "Service code has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCode = (index: number) => {
    if (window.confirm("Are you sure you want to delete this service code?")) {
      deleteCodeMutation.mutate(index);
    }
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
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          * { box-sizing: border-box; }
          body {
            width: 80mm;
            margin: 0;
            padding: 8mm 6mm;
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
          }
          .title {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 3px;
            letter-spacing: 1px;
          }
          .date {
            font-size: 8pt;
            color: #555;
          }
          .section {
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .info-row {
            display: flex;
            margin-bottom: 4px;
          }
          .label {
            font-weight: bold;
            min-width: 45px;
          }
          .value {
            flex: 1;
            word-wrap: break-word;
          }
          .divider {
            border-top: 1px dashed #999;
            margin: 8px 0;
          }
          .codes-header {
            font-weight: bold;
            margin-bottom: 6px;
            text-transform: uppercase;
            font-size: 9pt;
          }
          .code-item {
            border: 1px solid #ddd;
            padding: 6px;
            margin-bottom: 6px;
            background: #fafafa;
            page-break-inside: avoid;
          }
          .service-name {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10pt;
            margin-bottom: 3px;
          }
          .code-value {
            font-family: 'Courier New', monospace;
            font-size: 11pt;
            font-weight: bold;
            margin: 4px 0;
            letter-spacing: 0.5px;
          }
          .code-detail {
            font-size: 8pt;
            margin-top: 4px;
            line-height: 1.3;
          }
          .code-detail strong {
            display: inline-block;
            min-width: 50px;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            border-top: 2px dashed #000;
            padding-top: 8px;
            font-size: 8pt;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CLIENT RECEIPT</div>
          <div class="date">${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="section">
          <div class="info-row">
            <span class="label">Client:</span>
            <span class="value">${client.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">${client.phone}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section">
          <div class="codes-header">Service Codes (${client.codes.length})</div>
          ${client.codes.map(code => `
            <div class="code-item">
              <div class="service-name">${code.service.replace(/-/g, ' ')}</div>
              <div class="code-value">${code.code}</div>
              <div class="code-detail">
                <div><strong>Holder:</strong> ${code.accountHolderName || 'N/A'}</div>
                ${code.address? `<div><strong>Address:</strong> ${code.address}</div>` : ''}
                ${code.phoneNumber? `<div><strong>Phone:</strong> ${code.phoneNumber}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          Thank you for your business!
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
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { size: A4; margin: 15mm; }
            body { margin: 0; padding: 0; }
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            padding: 10mm;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #2c3e50;
          }
          .title {
            font-size: 26pt;
            font-weight: bold;
            margin-bottom: 8px;
            color: #1a252f;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 11pt;
            color: #7f8c8d;
          }
          .info-section {
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 12px 15px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
          }
          .info-label {
            font-weight: 600;
            font-size: 10pt;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          .info-value {
            font-size: 13pt;
            color: #2c3e50;
            font-weight: 500;
          }
          .codes-section {
            margin-top: 25px;
          }
          .codes-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 8px;
          }
          .codes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 12px;
          }
          .code-card {
            border: 1.5px solid #d5d8dc;
            border-radius: 6px;
            padding: 12px;
            background: #ffffff;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          }
          .service-label {
            font-weight: 600;
            font-size: 10pt;
            color: #3498db;
            text-transform: uppercase;
            margin-bottom: 6px;
            letter-spacing: 0.3px;
          }
          .code-value {
            font-family: 'Courier New', monospace;
            font-size: 12pt;
            background: #ecf0f1;
            padding: 8px 10px;
            border-radius: 4px;
            word-break: break-all;
            font-weight: 600;
            color: #2c3e50;
            margin: 6px 0;
          }
          .code-details {
            margin-top: 8px;
            font-size: 9pt;
            color: #5d6d7e;
            line-height: 1.5;
          }
          .code-details div {
            margin-bottom: 3px;
          }
          .code-details strong {
            font-weight: 600;
            color: #34495e;
            display: inline-block;
            min-width: 80px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            font-size: 9pt;
            color: #95a5a6;
          }
          .footer p {
            margin: 3px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Client Information</div>
          <div class="subtitle">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="info-section">
          <div class="info-label">Client Name</div>
          <div class="info-value">${client.name}</div>
        </div>
        
        <div class="info-section">
          <div class="info-label">Phone Number</div>
          <div class="info-value">${client.phone}</div>
        </div>
        
        <div class="codes-section">
          <div class="codes-title">Service Codes (${client.codes.length})</div>
          <div class="codes-grid">
            ${client.codes.map(code => `
              <div class="code-card">
                <div class="service-label">${code.service.replace(/-/g, ' ')}</div>
                <div class="code-value">${code.code}</div>
                <div class="code-details">
                  <div><strong>Account Holder:</strong> ${code.accountHolderName || 'N/A'}</div>
                  ${code.address ? `<div><strong>Address:</strong> ${code.address}</div>` : ''}
                  ${code.phoneNumber ? `<div><strong>Contact:</strong> ${code.phoneNumber}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Customer Management System</strong></p>
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
            <h3 className="font-semibold mb-3">
              {editingIndex !== null ? "Edit Service Code" : "Add New Service Code"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input
                placeholder="Code"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                data-testid="input-quick-code"
              />
              <Select
                value={newCode.service}
                onValueChange={(value) => setNewCode({ ...newCode, service: value })}
              >
                <SelectTrigger data-testid="select-quick-service">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCodes
                    .filter((sc) => sc.isActive === 1)
                    .map((serviceCode) => (
                      <SelectItem 
                        key={serviceCode.serviceId} 
                        value={serviceCode.serviceId}
                      >
                        {serviceCode.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Full Name (optional)"
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

            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleQuickAdd}
                disabled={addCodeMutation.isPending || editCodeMutation.isPending}
                data-testid="button-submit-quick-add"
              >
                {editingIndex !== null
                  ? editCodeMutation.isPending ? "Updating..." : "Update Code"
                  : addCodeMutation.isPending ? "Adding..." : "Add Code"
                }
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
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
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.codes.map((codeItem, index) => (
                  <TableRow key={`${codeItem.service}-${index}`} data-testid={`row-code-${index}`}>
                    <TableCell data-testid={`text-code-${index}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{codeItem.code}</span>
                        {movedCodes.has(`${codeItem.service}-${codeItem.code}-${index}`) && (
                          <Badge variant="secondary" className="border-amber-200 bg-amber-100 text-amber-800">
                            Moved
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyCode(codeItem.code, codeItem.service, index)}
                          data-testid={`button-copy-code-${index}`}
                          aria-label="Copy code"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(index)}
                          data-testid={`button-edit-code-${index}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCode(index)}
                          data-testid={`button-delete-code-${index}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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
