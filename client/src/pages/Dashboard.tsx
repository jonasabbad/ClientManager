import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { StatCard } from "@/components/StatCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ClientCard } from "@/components/ClientCard";
import { Users, CreditCard, Zap, Plus, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Client, InsertClient } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Statistics {
  totalClients: number;
  totalCodes: number;
  clientsThisMonth: number;
  serviceBreakdown: Record<string, number>;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: stats } = useQuery<Statistics>({
    queryKey: ["/api/statistics"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({ title: "Success", description: "Client added successfully" });
      setIsAddClientOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    },
  });

  const serviceNames: Record<string, string> = {
    "inwi": "Inwi",
    "orange": "Orange",
    "maroc-telecom": "Maroc T.",
    "water": "Water",
    "gas": "Gas",
    "electricity": "Electricity",
  };

  const chartData = Object.entries(stats?.serviceBreakdown || {}).map(([service, count]) => ({
    name: serviceNames[service] || service,
    clients: count,
  }));

  const recentActivities = clients
    .slice(0, 5)
    .map((client, index) => ({
      id: client.id.toString(),
      type: "add" as const,
      clientName: client.name,
      timestamp: new Date(client.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  const lastMonthClients = stats?.totalClients ? stats.totalClients - stats.clientsThisMonth : 0;
  const clientGrowth = lastMonthClients > 0
    ? Math.round(((stats?.clientsThisMonth || 0) / lastMonthClients) * 100)
    : 0;

  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.codes.some(code => code.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your customer management system</p>
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

      {searchQuery && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Search Results {filteredClients.length > 0 && `(${filteredClients.length})`}
          </h2>
          {filteredClients.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No clients found matching your search.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client: Client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          icon={Users}
          trend={
            clientGrowth > 0
              ? { value: `+${clientGrowth}% from last month`, isPositive: true }
              : undefined
          }
        />
        <StatCard
          title="Total Codes"
          value={stats?.totalCodes || 0}
          icon={CreditCard}
        />
        <StatCard
          title="Active Services"
          value={Object.keys(stats?.serviceBreakdown || {}).length}
          icon={Zap}
        />
        <StatCard
          title="This Month"
          value={stats?.clientsThisMonth || 0}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-6">Clients per Service</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.375rem",
                  }}
                />
                <Bar dataKey="clients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </Card>

        <ActivityFeed activities={recentActivities} />
      </div>

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
