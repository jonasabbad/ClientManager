import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Edit, Trash2, ChevronRight } from "lucide-react";
import type { Client } from "@shared/schema";
import type { FirestoreClient } from "@/lib/firestoreService";

interface ClientCardProps {
  client: FirestoreClient;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function ClientCard({ client, onEdit, onDelete, onClick }: ClientCardProps) {
  const displayPhone = client.phone && client.phone.trim().length > 0 ? client.phone : "No phone provided";
  return (
    <Card 
      className="p-6 hover-elevate cursor-pointer" 
      data-testid={`card-client-${client.id}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1" data-testid={`text-client-name-${client.id}`}>
            {client.name}
          </h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span data-testid={`text-client-phone-${client.id}`}>{displayPhone}</span>
            </div>
          </div>
          {client.codes.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                {client.codes.length} service {client.codes.length === 1 ? 'code' : 'codes'}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            data-testid={`button-edit-client-${client.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            data-testid={`button-delete-client-${client.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
