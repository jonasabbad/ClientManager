import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Edit, Trash2 } from "lucide-react";
import { ServiceBadge, ServiceType } from "./ServiceBadge";
import { CodeDisplay } from "./CodeDisplay";

export interface ClientCode {
  service: ServiceType;
  code: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  codes: ClientCode[];
}

interface ClientCardProps {
  client: Client;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card className="p-6 hover-elevate" data-testid={`card-client-${client.id}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1" data-testid={`text-client-name-${client.id}`}>
            {client.name}
          </h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span data-testid={`text-client-phone-${client.id}`}>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span data-testid={`text-client-email-${client.id}`}>{client.email}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            data-testid={`button-edit-client-${client.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            data-testid={`button-delete-client-${client.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {client.codes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Service Codes</p>
          {client.codes.map((codeItem) => (
            <div key={codeItem.service} className="space-y-2">
              <ServiceBadge service={codeItem.service} />
              <CodeDisplay code={codeItem.code} service={codeItem.service} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
