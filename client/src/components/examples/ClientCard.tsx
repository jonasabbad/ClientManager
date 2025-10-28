import { ClientCard } from "../ClientCard";
import { Toaster } from "@/components/ui/toaster";

export default function ClientCardExample() {
  const sampleClient = {
    id: 1,
    name: "Ahmed El Mansouri",
    phone: "+212 612 345 678",
    email: "ahmed@example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
    codes: [
      { service: "inwi" as const, code: "0612345678" },
      { service: "orange" as const, code: "0698765432" },
      { service: "water" as const, code: "123456789012" },
    ],
  };

  return (
    <>
      <div className="p-8 max-w-md">
        <ClientCard
          client={sampleClient}
          onEdit={() => console.log('Edit client:', sampleClient.id)}
          onDelete={() => console.log('Delete client:', sampleClient.id)}
        />
      </div>
      <Toaster />
    </>
  );
}
