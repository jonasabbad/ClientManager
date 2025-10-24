import { useState } from "react";
import { ClientCard, Client } from "@/components/ClientCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { AddClientDialog } from "@/components/AddClientDialog";

export default function Clients() {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Remove mock data - replace with real data from backend
  const mockClients: Client[] = [
    {
      id: "1",
      name: "Ahmed El Mansouri",
      phone: "+212 612 345 678",
      email: "ahmed@example.com",
      codes: [
        { service: "inwi", code: "0612345678" },
        { service: "orange", code: "0698765432" },
        { service: "water", code: "123456789012" },
      ],
    },
    {
      id: "2",
      name: "Fatima Zahra",
      phone: "+212 623 456 789",
      email: "fatima@example.com",
      codes: [
        { service: "maroc-telecom", code: "0623456789" },
        { service: "electricity", code: "987654321098" },
      ],
    },
    {
      id: "3",
      name: "Hassan Alami",
      phone: "+212 634 567 890",
      email: "hassan@example.com",
      codes: [
        { service: "inwi", code: "0634567890" },
        { service: "gas", code: "456789012345" },
        { service: "water", code: "789012345678" },
      ],
    },
  ];

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.codes.some(code => code.code.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage all your clients and their service codes</p>
        </div>
        <Button onClick={() => setIsAddClientOpen(true)} data-testid="button-add-client">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, or code..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => console.log('Edit client:', client.id)}
              onDelete={() => console.log('Delete client:', client.id)}
            />
          ))}
        </div>
      )}

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSubmit={(data) => {
          console.log('New client data:', data);
        }}
      />
    </div>
  );
}
