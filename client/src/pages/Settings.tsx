import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Database, FileText, Trash2, Edit } from "lucide-react";
import { useState } from "react";
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

  // Fetch service codes from database
  const { data: serviceCodes, isLoading } = useQuery<ServiceCodeConfig[]>({
    queryKey: ["/api/service-codes"],
  });

  // Add service code mutation
  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: { serviceId: string; name: string; category: string }) => {
      const res = await apiRequest("POST", "/api/service-codes", { ...serviceData, isActive: 1 });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
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
      const res = await apiRequest("PATCH", `/api/service-codes/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
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
      const res = await apiRequest("DELETE", `/api/service-codes/${id}`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
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

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully",
    });
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
        <Button onClick={handleSaveSettings} data-testid="button-save-settings">
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
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
                defaultValue="Customer Management System"
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-country">Default Country Code</Label>
              <Input
                id="default-country"
                placeholder="+212"
                defaultValue="+212"
                data-testid="input-country-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="records-per-page">Records Per Page</Label>
              <Select defaultValue="10">
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
              <Label className="mb-2 block">Export Data</Label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" data-testid="button-export-csv">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
                <Button variant="outline" className="flex-1" data-testid="button-export-pdf">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Database Actions</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Total Records: <span className="font-semibold">Loading...</span>
              </p>
              <Button variant="outline" className="w-full" data-testid="button-backup">
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
