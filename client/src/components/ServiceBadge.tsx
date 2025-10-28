import { Badge } from "@/components/ui/badge";
import { Phone, Zap, Droplet, Flame, Tag } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ServiceCodeConfig } from "@shared/schema";

export type ServiceType = string;

interface ServiceBadgeProps {
  service: ServiceType;
  className?: string;
}

const serviceConfig: Record<string, { label: string; icon: LucideIcon; colorClass: string }> = {
  "inwi": { label: "Inwi", icon: Phone, colorClass: "bg-service-inwi text-service-inwi-foreground" },
  "orange": { label: "Orange", icon: Phone, colorClass: "bg-service-orange text-service-orange-foreground" },
  "maroc-telecom": { label: "Maroc Telecom", icon: Phone, colorClass: "bg-service-maroc-telecom text-service-maroc-telecom-foreground" },
  "water": { label: "Water", icon: Droplet, colorClass: "bg-service-water text-service-water-foreground" },
  "gas": { label: "Gas", icon: Flame, colorClass: "bg-service-gas text-service-gas-foreground" },
  "electricity": { label: "Electricity", icon: Zap, colorClass: "bg-service-electricity text-service-electricity-foreground" },
};

const categoryIcons: Record<string, LucideIcon> = {
  "telecom": Phone,
  "utility": Zap,
};

export function ServiceBadge({ service, className }: ServiceBadgeProps) {
  const { data: serviceCodes = [] } = useQuery<ServiceCodeConfig[]>({
    queryKey: ["/api/service-codes"],
  });

  // Try to find the service in the config first (for backward compatibility)
  let config = serviceConfig[service];
  let Icon: LucideIcon = Tag;
  let label = service;
  let colorClass = "bg-muted text-muted-foreground";

  if (config) {
    Icon = config.icon;
    label = config.label;
    colorClass = config.colorClass;
  } else {
    // Look up service in the database
    const serviceCodeConfig = serviceCodes.find(sc => sc.serviceId === service);
    if (serviceCodeConfig) {
      label = serviceCodeConfig.name;
      Icon = categoryIcons[serviceCodeConfig.category] || Tag;
      colorClass = serviceCodeConfig.category === "telecom" 
        ? "bg-service-inwi text-service-inwi-foreground"
        : "bg-service-electricity text-service-electricity-foreground";
    }
  }

  return (
    <Badge
      className={`${colorClass} gap-1.5 ${className || ""}`}
      data-testid={`badge-service-${service}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
