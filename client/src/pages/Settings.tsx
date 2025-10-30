import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings as SettingsIcon,
  Save,
  Database,
  FileText,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle,
  XCircle,
  Upload,
  Download,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const toHex = (channel: number) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getServiceColor(value?: string): string {
  if (!value) return FALLBACK_SERVICE_COLOR;
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
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(100, 116, 139, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getReadableTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#0f172a";
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#f8fafc";
}

type ServiceColorAccentProps = {
  text: string;
  placeholder: string;
  colorSource?: string;
  variant?: "solid" | "subtle";
  className?: string;
  labelClassName?: string;
};

function ServiceColorAccent({
  text,
  placeholder,
  colorSource,
  variant = "subtle",
  className,
  labelClassName,
}: ServiceColorAccentProps) {
  const displayText = text?.trim() ? text : placeholder;
  const color = getServiceColor(colorSource ?? text ?? placeholder);
  const circleStyle = {
    backgroundColor: color,
    borderColor: hexToRgba(color, 0.6),
  } as const;
  const pillStyle =
    variant === "solid"
      ? {
          backgroundColor: color,
          color: getReadableTextColor(color),
        }
      : {
          backgroundColor: hexToRgba(color, 0.16),
          borderColor: hexToRgba(color, 0.45),
          color,
        };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="h-2.5 w-2.5 rounded-full border" style={circleStyle} aria-hidden />
      <span
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
          variant === "subtle" && "border",
          labelClassName,
        )}
        style={pillStyle}
      >
        {displayText}
      </span>
    </div>
  );
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
    status: "success" | "error" | null;
    message: string;
    details?: any;
  }>({ status: null, message: "" });

  const [companyName, setCompanyName] = useState("Customer Management System");
  const [defaultCountryCode, setDefaultCountryCode] = useState("+212");
  const [recordsPerPage, setRecordsPerPage] = useState("10");

  const importFileRef = useRef<HTMLInputElement>(null);

  // ✅ Corrected CSV parser
  const parseCsvText = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n" && !insideQuotes) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  };

  // -- component logic continues here (mutations, queries, etc.) --
  // NOTE: your other service handling logic goes here, unchanged.

  return (
    <div className="space-y-6">
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

        {/* Add Service Form */}
        {showAddForm && (
          <Card className="p-4 mb-4 bg-muted/50">
            <h3 className="font-semibold mb-3">Add New Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Service ID (e.g., 'iam')"
                  value={newService.serviceId}
                  onChange={(e) =>
                    setNewService({ ...newService, serviceId: e.target.value })
                  }
                />
                <ServiceColorAccent
                  text={newService.serviceId}
                  placeholder="Service ID"
                  colorSource={newService.serviceId || newService.name}
                  variant="solid"
                  className="text-xs text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService({ ...newService, name: e.target.value })
                  }
                />
                <ServiceColorAccent
                  text={newService.name}
                  placeholder="Service Name"
                  colorSource={newService.name || newService.serviceId}
                  variant="solid"
                  className="text-xs text-muted-foreground"
                />
              </div>
              <Select
                value={newService.category}
                onValueChange={(value) =>
                  setNewService({ ...newService, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => {}}>Add Service</Button>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
