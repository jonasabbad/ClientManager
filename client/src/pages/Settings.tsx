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

const FALLBACK_SERVICE_COLOR = "#64748b";

function hashStringToHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSegment = h / 60;
  const intermediate = chroma * (1 - Math.abs((hueSegment % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    r = chroma;
    g = intermediate;
  } else if (hueSegment >= 1 && hueSegment < 2) {
    r = intermediate;
    g = chroma;
  } else if (hueSegment >= 2 && hueSegment < 3) {
    g = chroma;
    b = intermediate;
  } else if (hueSegment >= 3 && hueSegment < 4) {
    g = intermediate;
    b = chroma;
  } else if (hueSegment >= 4 && hueSegment < 5) {
    r = intermediate;
    b = chroma;
  } else if (hueSegment >= 5 && hueSegment < 6) {
    r = chroma;
    b = intermediate;
  }

  const match = lightness - chroma / 2;
  const toHex = (channel: number) => {
    return Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getServiceColor(value?: string): string {
  if (!value) {
    return FALLBACK_SERVICE_COLOR;
  }
  const hue = hashStringToHue(value.trim().toLowerCase());
  return hslToHex(hue, 65, 55);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    if ([r, g, b].some(Number.isNaN)) {
      return null;
    }
    return { r, g, b };
  }
  if (normalized.length !== 6) {
    return null;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) {
    return null;
  }
  return { r, g, b };
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(100, 116, 139, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getReadableTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return "#0f172a";
  }
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#f8fafc";
}

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

  const newServiceIdColor = getServiceColor(newService.serviceId || newService.name);
  const newServiceNameColor = getServiceColor(newService.name || newService.serviceId);
  const editServiceIdColor = getServiceColor(editData.serviceId || editingService?.serviceId);
  const editServiceNameColor = getServiceColor(editData.name || editingService?.name);
  
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
@@ -756,179 +862,291 @@ export default function Settings() {
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
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Service ID (e.g., 'iam')"
                  value={newService.serviceId}
                  onChange={(e) => setNewService({ ...newService, serviceId: e.target.value })}
                  data-testid="input-service-id"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: newServiceIdColor,
                      borderColor: hexToRgba(newServiceIdColor, 0.6),
                    }}
                    aria-hidden
                  />
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: newServiceIdColor,
                      color: getReadableTextColor(newServiceIdColor),
                    }}
                  >
                    {newService.serviceId || 'Service ID'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  data-testid="input-service-name"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: newServiceNameColor,
                      borderColor: hexToRgba(newServiceNameColor, 0.6),
                    }}
                    aria-hidden
                  />
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: newServiceNameColor,
                      color: getReadableTextColor(newServiceNameColor),
                    }}
                  >
                    {newService.name || 'Service Name'}
                  </span>
                </div>
              </div>
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
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Service ID"
                  value={editData.serviceId}
                  onChange={(e) => setEditData({ ...editData, serviceId: e.target.value })}
                  data-testid="input-edit-service-id"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: editServiceIdColor,
                      borderColor: hexToRgba(editServiceIdColor, 0.6),
                    }}
                    aria-hidden
                  />
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: editServiceIdColor,
                      color: getReadableTextColor(editServiceIdColor),
                    }}
                  >
                    {editData.serviceId || editingService?.serviceId || 'Service ID'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Service Name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  data-testid="input-edit-service-name"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: editServiceNameColor,
                      borderColor: hexToRgba(editServiceNameColor, 0.6),
                    }}
                    aria-hidden
                  />
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: editServiceNameColor,
                      color: getReadableTextColor(editServiceNameColor),
                    }}
                  >
                    {editData.name || editingService?.name || 'Service Name'}
                  </span>
                </div>
              </div>
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
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading services...
                </TableCell>
              </TableRow>
            ) : serviceCodes && serviceCodes.length > 0 ? (
              serviceCodes.map((service) => {
                const serviceIdColor = getServiceColor(service.serviceId);
                const serviceNameColor = getServiceColor(service.name);
                return (
                  <TableRow key={service.id} data-testid={`row-service-${service.serviceId}`}>
                    <TableCell className="font-mono" data-testid={`text-id-${service.serviceId}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full border"
                          style={{
                            backgroundColor: serviceIdColor,
                            borderColor: hexToRgba(serviceIdColor, 0.6),
                          }}
                          aria-hidden
                        />
                        <span
                          className="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: hexToRgba(serviceIdColor, 0.18),
                            borderColor: hexToRgba(serviceIdColor, 0.45),
                          }}
                        >
                          {service.serviceId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-name-${service.serviceId}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full border"
                          style={{
                            backgroundColor: serviceNameColor,
                            borderColor: hexToRgba(serviceNameColor, 0.6),
                          }}
                          aria-hidden
                        />
                        <span
                          className="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: hexToRgba(serviceNameColor, 0.18),
                            borderColor: hexToRgba(serviceNameColor, 0.45),
                          }}
                        >
                          {service.name}
                        </span>
                      </div>
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
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
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
