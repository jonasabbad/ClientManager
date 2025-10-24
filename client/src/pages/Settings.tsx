import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Database, FileText } from "lucide-react";
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

const defaultServices = [
  { id: "inwi", name: "Inwi", category: "telecom", color: "bg-orange-500" },
  { id: "orange", name: "Orange", category: "telecom", color: "bg-orange-600" },
  { id: "maroc-telecom", name: "Maroc Telecom", category: "telecom", color: "bg-blue-500" },
  { id: "water", name: "Water", category: "utility", color: "bg-blue-400" },
  { id: "gas", name: "Gas", category: "utility", color: "bg-yellow-500" },
  { id: "electricity", name: "Electricity", category: "utility", color: "bg-amber-500" },
];

export default function Settings() {
  const { toast } = useToast();
  const [services, setServices] = useState(defaultServices);
  const [newService, setNewService] = useState({
    id: "",
    name: "",
    category: "",
    color: "bg-gray-500",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSaveSettings = () => {
    // In a real app, this would save to backend/localStorage
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully",
    });
  };

  const handleAddService = () => {
    if (!newService.id || !newService.name || !newService.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setServices([...services, newService]);
    setNewService({ id: "", name: "", category: "", color: "bg-gray-500" });
    setShowAddForm(false);
    toast({
      title: "Service Added",
      description: `${newService.name} has been added to available services`,
    });
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
                value={newService.id}
                onChange={(e) => setNewService({ ...newService, id: e.target.value })}
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
              <Button onClick={handleAddService} data-testid="button-submit-service">
                Add Service
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                <TableCell className="font-mono" data-testid={`text-id-${service.id}`}>
                  {service.id}
                </TableCell>
                <TableCell data-testid={`text-name-${service.id}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${service.color}`} />
                    {service.name}
                  </div>
                </TableCell>
                <TableCell data-testid={`text-category-${service.id}`}>
                  <Badge variant="outline" className="capitalize">
                    {service.category}
                  </Badge>
                </TableCell>
                <TableCell data-testid={`text-status-${service.id}`}>
                  <Badge className="bg-green-500">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
