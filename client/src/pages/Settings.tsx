import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Database, FileText, Trash2, Edit, RefreshCw, CheckCircle, XCircle, Upload, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServiceCodeConfig } from "@shared/schema";
import { firebaseConfig } from "@/lib/firebase";
import { firestoreService } from "@/lib/firestoreService";

export default function Settings() {
  const { toast } = useToast();
  const [newService, setNewService] = useState({
    serviceId: "",
    name: "",
    category: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCodeConfig | null>(null);
  const [editData, setEditData] = useState({
    serviceId: "",
    name: "",
    category: "",
  });
  const [firebaseTestResult, setFirebaseTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    details?: any;
  }>({ status: null, message: '' });
  
  // Settings form state
  const [companyName, setCompanyName] = useState('Customer Management System');
  const [defaultCountryCode, setDefaultCountryCode] = useState('+212');
  const [recordsPerPage, setRecordsPerPage] = useState('10');
  
  // File input ref for import
  const importFileRef = useRef<HTMLInputElement>(null);

  // CSV Helper functions for proper quote/escape handling (RFC 4180 compliant)
  const escapeCsvField = (field: string | number): string => {
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Parse entire CSV text into rows, handling quoted newlines properly (RFC 4180 compliant)
  const parseCsvText = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // End of field - preserve whitespace as per RFC 4180
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' && !insideQuotes) {
        // End of row (only if not inside quotes)
        currentRow.push(currentField);
        // Only add row if it has at least one non-empty field
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\r' && nextChar === '\n' && !insideQuotes) {
        // Windows line ending - end of row
        currentRow.push(currentField);
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++; // Skip the \n
      } else if (char === '\r' && !insideQuotes) {
        // Mac line ending - end of row
        currentRow.push(currentField);
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field and row if any
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
    }
    
    return rows;
  };

  // Fetch app settings
  const { data: appSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => firestoreService.getSettings(),
  });

  // Load settings into form when data is fetched
  useEffect(() => {
    if (appSettings) {
      setCompanyName(appSettings.companyName || 'Customer Management System');
      setDefaultCountryCode(appSettings.defaultCountryCode || '+212');
      setRecordsPerPage(String(appSettings.recordsPerPage || 10));
      if (appSettings.firebaseTestResult) {
        setFirebaseTestResult(appSettings.firebaseTestResult);
      }
    }
  }, [appSettings]);

  // Fetch service codes from Firestore
  const { data: serviceCodes, isLoading } = useQuery<ServiceCodeConfig[]>({
    queryKey: ["service-codes"],
    queryFn: () => firestoreService.getAllServiceCodes(),
  });

  // Add service code mutation
  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: { serviceId: string; name: string; category: string }) => {
      return await firestoreService.createServiceCode({ ...serviceData, isActive: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-codes"] });
      toast({
        title: "Service Added",
        description: "Service has been added successfully",
      });
      setNewService({ serviceId: "", name: "", category: "" });
      setShowAddForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    },
  });

  // Update service code mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { serviceId: string; name: string; category: string } }) => {
      return await firestoreService.updateServiceCode(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-codes"] });
      toast({
        title: "Service Updated",
        description: "Service has been updated successfully",
      });
      setEditingService(null);
      setEditData({ serviceId: "", name: "", category: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    },
  });

  // Delete service code mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await firestoreService.deleteServiceCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-codes"] });
      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  // Test Firebase connection mutation (using frontend Firestore service)
  const testFirebaseMutation = useMutation({
    mutationFn: async () => {
      const result = await firestoreService.testConnection();
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: (data) => {
      setFirebaseTestResult({
        status: data.status,
        message: data.message,
        details: data.details,
      });
      toast({
        title: "Connection Successful",
        description: data.message,
      });
    },
    onError: (error: any) => {
      setFirebaseTestResult({
        status: 'error',
        message: error.message || 'Firebase connection failed',
        details: { connected: false, timestamp: new Date().toISOString() },
      });
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect to Firebase',
        variant: "destructive",
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      return await firestoreService.saveSettings({
        companyName,
        defaultCountryCode,
        recordsPerPage: parseInt(recordsPerPage),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate();
  };

  const handleAddService = () => {
    if (!newService.serviceId || !newService.name || !newService.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    addServiceMutation.mutate(newService);
  };

  const handleEditService = (service: ServiceCodeConfig) => {
    setEditingService(service);
    setEditData({
      serviceId: service.serviceId,
      name: service.name,
      category: service.category,
    });
    setShowAddForm(false);
  };

  const handleUpdateService = () => {
    if (!editData.serviceId || !editData.name || !editData.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: editData });
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setEditData({ serviceId: "", name: "", category: "" });
  };

  // Database backup - export all clients to JSON
  const handleBackup = async () => {
    try {
      const clients = await firestoreService.getAllClients();
      const backup = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        totalClients: clients.length,
        clients: clients,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Created",
        description: `Successfully exported ${clients.length} clients`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup",
        variant: "destructive",
      });
    }
  };

  // Export codes to CSV with pipe delimiter (one row per service code)
  const handleExportCodes = async () => {
    try {
      const clients = await firestoreService.getAllClients();
      
      // CSV header: SERVICE|CODE|DETAILS|Address
      const headers = ["SERVICE", "CODE", "DETAILS", "Address"];
      
      // Build rows - one row per service code
      const rows: string[][] = [];
      clients.forEach(client => {
        client.codes.forEach(codeObj => {
          rows.push([
            codeObj.service.toUpperCase(),
            codeObj.code,
            client.address || "",
            client.name,
          ]);
        });
      });

      // Use pipe delimiter
      const csv = [headers, ...rows].map(row => row.join("|")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codes-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${rows.length} service codes from ${clients.length} clients`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export codes",
        variant: "destructive",
      });
    }
  };

  // Download example CSV file
  const handleDownloadExample = () => {
    const exampleData = [
      ["SERVICE", "CODE", "DETAILS", "Address"],
      ["INWI", "700669885", "mobile facture", "youness"],
      ["ORANGE", "615454569", "home internet", "youness"],
      ["ORANGE", "615454569", "", "asma"],
      ["MAROC-TELECOM", "MT123456", "mobile", "Ahmed"],
      ["WATER", "WTR789", "apartment 5", "Fatima"],
    ];

    const csv = exampleData.map(row => row.join("|")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codes-import-example.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Example Downloaded",
      description: "Sample CSV file downloaded successfully",
    });
  };

  // Import codes from CSV
  const handleImportCodes = () => {
    importFileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      
      // Parse pipe-delimited CSV
      const rows = text.trim().split("\n").map(line => line.split("|").map(v => v.trim()));
      
      if (rows.length < 2) {
        toast({
          title: "Invalid File",
          description: "CSV file is empty or has no data",
          variant: "destructive",
        });
        return;
      }

      // First row is headers
      const headers = rows[0].map(h => h.trim().toUpperCase());
      const dataRows = rows.slice(1);

      // Group rows by client name/address
      const clientsMap = new Map<string, any>();

      for (const values of dataRows) {
        try {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          const service = (row.SERVICE || "").toLowerCase().replace(/_/g, "-");
          const code = row.CODE;
          const details = row.DETAILS || "";
          const address = row.ADDRESS || details;

          if (!service || !code || !address) {
            continue;
          }

          // Use address as unique key
          if (!clientsMap.has(address)) {
            clientsMap.set(address, {
              name: address,
              phone: "000000000", // Default phone
              address: details,
              codes: [],
            });
          }

          const client = clientsMap.get(address);
          
          // Add service code
          client.codes.push({
            service: service,
            code: code,
          });
        } catch (error) {
          // Skip invalid rows
        }
      }

      let imported = 0;
      let errors = 0;

      // Create clients in Firestore
      for (const clientData of Array.from(clientsMap.values())) {
        try {
          await firestoreService.createClient(clientData);
          imported++;
        } catch (error) {
          errors++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });

      toast({
        title: "Import Complete",
        description: `Imported ${imported} clients${errors > 0 ? `, ${errors} errors` : ""}`,
      });

      // Reset file input
      if (importFileRef.current) {
        importFileRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import codes from CSV",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application settings and service codes
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saveSettingsMutation.isPending}
          data-testid="button-save-settings"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="h-5 w-5" />
            <h2 className="text-xl font-semibold">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                placeholder="Your Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-country">Default Country Code</Label>
              <Input
                id="default-country"
                placeholder="+212"
                value={defaultCountryCode}
                onChange={(e) => setDefaultCountryCode(e.target.value)}
                data-testid="input-country-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="records-per-page">Records Per Page</Label>
              <Select value={recordsPerPage} onValueChange={setRecordsPerPage}>
                <SelectTrigger id="records-per-page" data-testid="select-records-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Firebase Database</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Firebase project configuration and connection status
              </p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Connection Status</Label>
                  <Badge variant={firebaseTestResult.status === 'success' ? 'default' : firebaseTestResult.status === 'error' ? 'destructive' : 'secondary'} data-testid="badge-connection-status">
                    {firebaseTestResult.status === 'success' ? 'Connected' : firebaseTestResult.status === 'error' ? 'Failed' : 'Not Tested'}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">API Key</Label>
                  <Input 
                    value={"•".repeat(40)} 
                    readOnly 
                    className="font-mono text-sm mt-1"
                    data-testid="input-api-key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Environment: Not Set</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Project ID</Label>
                  <Input 
                    value={firebaseConfig.projectId} 
                    readOnly 
                    className="mt-1"
                    data-testid="input-project-id"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Environment: Not Set</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">App ID</Label>
                  <Input 
                    value={firebaseConfig.appId} 
                    readOnly 
                    className="font-mono text-sm mt-1"
                    data-testid="input-app-id"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Environment: Not Set</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => testFirebaseMutation.mutate()}
                disabled={testFirebaseMutation.isPending}
                data-testid="button-test-firebase"
              >
                {testFirebaseMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Test Firebase Connection
                  </>
                )}
              </Button>
              
              {firebaseTestResult.status && (
                <div className={`mt-2 p-3 rounded-md text-sm ${
                  firebaseTestResult.status === 'success' 
                    ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {firebaseTestResult.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{firebaseTestResult.message}</p>
                      {firebaseTestResult.details && (
                        <div className="mt-1 text-xs opacity-80">
                          {firebaseTestResult.details.timestamp && (
                            <p>Tested: {new Date(firebaseTestResult.details.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label className="mb-2 block">Import / Export Codes</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Button variant="outline" onClick={handleImportCodes} data-testid="button-import-codes">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={handleExportCodes} data-testid="button-export-codes">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handleDownloadExample} data-testid="button-download-example">
                  <FileText className="mr-2 h-4 w-4" />
                  Download Example
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV Format: SERVICE|CODE|DETAILS|Address (pipe-delimited, one row per service)
              </p>
              <input
                ref={importFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <Label className="mb-2 block">Database Backup</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Export all data to JSON format for backup
              </p>
              <Button variant="outline" className="w-full" onClick={handleBackup} data-testid="button-backup">
                <Database className="mr-2 h-4 w-4" />
                Create Backup
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Service Codes Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Manage Service Codes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure available service types for client codes
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            data-testid="button-add-service"
          >
            {showAddForm ? "Cancel" : "Add Service"}
          </Button>
        </div>

        {showAddForm && (
          <Card className="p-4 mb-4 bg-muted/50">
            <h3 className="font-semibold mb-3">Add New Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Service ID (e.g., 'iam')"
                value={newService.serviceId}
                onChange={(e) => setNewService({ ...newService, serviceId: e.target.value })}
                data-testid="input-service-id"
              />
              <Input
                placeholder="Service Name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                data-testid="input-service-name"
              />
              <Select
                value={newService.category}
                onValueChange={(value) => setNewService({ ...newService, category: value })}
              >
                <SelectTrigger data-testid="select-service-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddService} 
                disabled={addServiceMutation.isPending}
                data-testid="button-submit-service"
              >
                {addServiceMutation.isPending ? "Adding..." : "Add Service"}
              </Button>
            </div>
          </Card>
        )}

        {editingService && (
          <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Edit Service</h3>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} data-testid="button-cancel-edit">
                Cancel
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Service ID"
                value={editData.serviceId}
                onChange={(e) => setEditData({ ...editData, serviceId: e.target.value })}
                data-testid="input-edit-service-id"
              />
              <Input
                placeholder="Service Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                data-testid="input-edit-service-name"
              />
              <Select
                value={editData.category}
                onValueChange={(value) => setEditData({ ...editData, category: value })}
              >
                <SelectTrigger data-testid="select-edit-service-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleUpdateService} 
                disabled={updateServiceMutation.isPending}
                data-testid="button-update-service"
              >
                {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
              </Button>
            </div>
          </Card>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service ID</TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading services...
                </TableCell>
              </TableRow>
            ) : serviceCodes && serviceCodes.length > 0 ? (
              serviceCodes.map((service) => (
                <TableRow key={service.id} data-testid={`row-service-${service.serviceId}`}>
                  <TableCell className="font-mono" data-testid={`text-id-${service.serviceId}`}>
                    {service.serviceId}
                  </TableCell>
                  <TableCell data-testid={`text-name-${service.serviceId}`}>
                    {service.name}
                  </TableCell>
                  <TableCell data-testid={`text-category-${service.serviceId}`}>
                    <Badge variant="outline" className="capitalize">
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-status-${service.serviceId}`}>
                    <Badge className="bg-green-500">
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditService(service)}
                        disabled={updateServiceMutation.isPending || deleteServiceMutation.isPending}
                        data-testid={`button-edit-${service.serviceId}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteService(service.id)}
                        disabled={deleteServiceMutation.isPending || updateServiceMutation.isPending}
                        data-testid={`button-delete-${service.serviceId}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No services configured. Add your first service above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
