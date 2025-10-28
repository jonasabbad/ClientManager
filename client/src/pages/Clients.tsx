import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ClientCard } from "@/components/ClientCard";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Printer } from "lucide-react";
import { AddClientDialog } from "@/components/AddClientDialog";
import { EditClientDialog } from "@/components/EditClientDialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client, InsertClient } from "@shared/schema";
import { firestoreService, type FirestoreClient } from "@/lib/firestoreService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function Clients() {
  const [, navigate] = useLocation();
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<FirestoreClient | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<FirestoreClient[]>({
    queryKey: ["clients"],
    queryFn: () => firestoreService.getAllClients(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      return await firestoreService.createClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Success", description: "Client added successfully" });
      setIsAddClientOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertClient> }) => {
      return await firestoreService.updateClient(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Success", description: "Client updated successfully" });
      setEditingClient(null);
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
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Success", description: "Client deleted successfully" });
      setDeletingClientId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });


  const handleExportCSV = () => {
    const headers = ["Name", "Phone", "Services"];
    const rows = clients.map(client => [
      client.name,
      client.phone,
      client.codes.map(c => `${c.service}: ${c.code}`).join("; "),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Success", description: "CSV exported successfully" });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Client List", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Clients: ${clients.length}`, 14, 35);

    const tableData = clients.map((client: FirestoreClient) => [
      client.name,
      client.phone,
      client.codes.map(c => `${c.service}: ${c.code}`).join("\n"),
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Name", "Phone", "Service Codes"]],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [52, 73, 94], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 45 },
        2: { cellWidth: 90 },
      },
      margin: { top: 45, left: 14, right: 14 },
    });

    doc.save(`clients-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "Success", description: "PDF exported successfully" });
  };

  const handlePrint = (format: "80mm" | "a4") => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = format === "80mm"
      ? `
        @media print {
          @page { size: 80mm auto; margin: 5mm; }
          body { width: 80mm; font-size: 10px; }
          .client { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
          .client-name { font-weight: bold; font-size: 11px; }
          .code-item { margin: 3px 0; font-family: monospace; }
        }
      `
      : `
        @media print {
          @page { size: A4; margin: 20mm; }
          body { font-size: 12px; }
          .client { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; page-break-inside: avoid; }
          .client-name { font-weight: bold; font-size: 14px; margin-bottom: 8px; }
          .code-item { margin: 5px 0; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        }
      `;

    const content = clients.map((client: FirestoreClient) => `
      <div class="client">
        <div class="client-name">${client.name}</div>
        <div>📞 ${client.phone}</div>
        ${client.codes.map(code => `
          <div class="code-item">${code.service}: ${code.code}</div>
        `).join("")}
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Client List - ${format.toUpperCase()}</title>
          <style>${styles}</style>
        </head>
        <body>
          <h2 style="text-align: center;">Client List</h2>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
    toast({ title: "Print ready", description: `Prepared ${format.toUpperCase()} format` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your clients and their service codes
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export">
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV} data-testid="menu-export-csv">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} data-testid="menu-export-pdf">
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePrint("80mm")}>
                Print 80mm (Thermal)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint("a4")}>
                Print A4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setIsAddClientOpen(true)} data-testid="button-add-client">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients yet. Add your first client!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: FirestoreClient) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => navigate(`/clients/${client.id}`)}
              onEdit={() => setEditingClient(client)}
              onDelete={() => setDeletingClientId(client.id)}
            />
          ))}
        </div>
      )}

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSubmit={(data) => createMutation.mutate(data)}
      />

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open: boolean) => !open && setEditingClient(null)}
          onSubmit={(data: Partial<InsertClient>) => updateMutation.mutate({ id: editingClient.id, data })}
        />
      )}

      <AlertDialog open={!!deletingClientId} onOpenChange={() => setDeletingClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingClientId && deleteMutation.mutate(deletingClientId)}
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
