import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { StatCard } from "@/components/StatCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SmartSearch } from "@/components/SmartSearch";
import { Users, CreditCard, Zap, Plus, TrendingUp, Phone, Mail, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const { toast } = useToast();

  const { data: stats } = useQuery<Statistics>({
    queryKey: ["/api/statistics"],
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
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

      <SmartSearch clients={clients} />

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

      {/* Client List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">All Clients</h3>
            {!isLoadingClients && (
              <p className="text-sm text-muted-foreground mt-1">
                {clients.length} {clients.length === 1 ? 'client' : 'clients'} registered
              </p>
            )}
          </div>
        </div>
        {isLoadingClients ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading clients...</p>
          </div>
        ) : clients.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Service Codes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${client.id}`}>
                      {client.name}
                    </TableCell>
                    <TableCell data-testid={`text-phone-${client.id}`}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {client.phone}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-email-${client.id}`}>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-center" data-testid={`text-codes-${client.id}`}>
                      <Badge variant="outline" className="font-semibold">
                        <Code className="h-3 w-3 mr-1" />
                        {client.codes.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/${client.id}`)}
                        data-testid={`button-view-${client.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clients yet. Add your first client to get started.</p>
          </div>
        )}
      </Card>

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
