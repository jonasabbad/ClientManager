import { Badge } from "@/components/ui/badge";
import { Phone, Zap, Droplet, Flame } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type ServiceType = "inwi" | "orange" | "maroc-telecom" | "water" | "gas" | "electricity";

interface ServiceBadgeProps {
  service: ServiceType;
  className?: string;
}

const serviceConfig: Record<ServiceType, { label: string; icon: LucideIcon; colorClass: string }> = {
  "inwi": { label: "Inwi", icon: Phone, colorClass: "bg-service-inwi text-service-inwi-foreground" },
  "orange": { label: "Orange", icon: Phone, colorClass: "bg-service-orange text-service-orange-foreground" },
  "maroc-telecom": { label: "Maroc Telecom", icon: Phone, colorClass: "bg-service-maroc-telecom text-service-maroc-telecom-foreground" },
  "water": { label: "Water", icon: Droplet, colorClass: "bg-service-water text-service-water-foreground" },
  "gas": { label: "Gas", icon: Flame, colorClass: "bg-service-gas text-service-gas-foreground" },
  "electricity": { label: "Electricity", icon: Zap, colorClass: "bg-service-electricity text-service-electricity-foreground" },
};

export function ServiceBadge({ service, className }: ServiceBadgeProps) {
  const config = serviceConfig[service];
  const Icon = config.icon;

  return (
    <Badge
      className={`${config.colorClass} gap-1.5 ${className || ""}`}
      data-testid={`badge-service-${service}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
