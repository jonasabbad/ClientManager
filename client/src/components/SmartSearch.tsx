import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Client } from "@shared/schema";
import type { FirestoreClient } from "@/lib/firestoreService";

interface SmartSearchProps {
  clients: FirestoreClient[];
}

export function SmartSearch({ clients }: SmartSearchProps) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredClients, setFilteredClients] = useState<FirestoreClient[]>([]);

  // Define normalizePhone before useEffect
  const normalizePhone = (phone: string | undefined) => {
    // Strip all non-digit characters for comparison
    return phone ? phone.replace(/\D/g, '') : '';
  };

  useEffect(() => {
    if (!searchValue) {
      setFilteredClients([]);
      return;
    }

    const query = searchValue.toLowerCase();
    const normalizedQuery = normalizePhone(query);
    const hasDigits = /\d/.test(query); // Check if query contains any digits
    
    const filtered = clients.filter((client: FirestoreClient) => {
      const nameMatch = client.name.toLowerCase().includes(query);
      // For phone matching: use raw comparison always, and normalized only if query has digits
      cconst phoneMatch = client.phone ? (
        client.phone.toLowerCase().includes(query) ||
        (hasDigits && normalizePhone(client.phone).includes(normalizedQuery))
      ) : false;
      const codeMatch = client.codes.some(code => 
        code.code.toLowerCase().includes(query) ||
        (code.accountHolderName && code.accountHolderName.toLowerCase().includes(query)) ||
        code.service.toLowerCase().includes(query) ||
        (code.address && code.address.toLowerCase().includes(query)) ||
        (code.phoneNumber && (
          code.phoneNumber.includes(query) || 
          (hasDigits && normalizePhone(code.phoneNumber).includes(normalizedQuery))
        ))
      );
      
      return nameMatch || phoneMatch || codeMatch;
    });

    setFilteredClients(filtered.slice(0, 10)); // Limit to 10 results
  }, [searchValue, clients]);

  const handleSelect = (clientId: number) => {
    setOpen(false);
    // Keep search value so user can see what they searched for
    navigate(`/clients/${clientId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start text-left font-normal"
          data-testid="button-smart-search"
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {searchValue ? (
            <span className="truncate">{searchValue}</span>
          ) : (
            <span className="text-muted-foreground">
              Search by name, phone, or code...
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type to search..." 
            value={searchValue}
            onValueChange={setSearchValue}
            data-testid="input-smart-search"
          />
          <CommandList>
            {searchValue && filteredClients.length === 0 && (
              <CommandEmpty>No clients found.</CommandEmpty>
            )}
            {filteredClients.length > 0 && (
              <CommandGroup heading="Clients">
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id.toString()}
                    onSelect={() => handleSelect(client.id)}
                    data-testid={`search-result-${client.id}`}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.phone && client.phone.trim().length > 0 ? client.phone : "No phone provided"}
                      </div>
                      {client.codes.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {client.codes.length} service code{client.codes.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
