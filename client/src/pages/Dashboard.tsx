import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Users, CreditCard, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  // TODO: Remove mock data - replace with real data from backend
  const chartData = [
    { name: "Inwi", clients: 85 },
    { name: "Orange", clients: 72 },
    { name: "Maroc T.", clients: 65 },
    { name: "Water", clients: 130 },
    { name: "Gas", clients: 95 },
    { name: "Electricity", clients: 120 },
  ];

  const recentActivities = [
    { id: "1", type: "add" as const, clientName: "Ahmed El Mansouri", timestamp: "2 minutes ago" },
    { id: "2", type: "edit" as const, clientName: "Fatima Zahra", timestamp: "1 hour ago" },
    { id: "3", type: "add" as const, clientName: "Hassan Alami", timestamp: "2 hours ago" },
    { id: "4", type: "delete" as const, clientName: "Youssef Benali", timestamp: "3 hours ago" },
    { id: "5", type: "edit" as const, clientName: "Nadia Bouzid", timestamp: "5 hours ago" },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value="245"
          icon={Users}
          trend={{ value: "+12% from last month", isPositive: true }}
        />
        <StatCard
          title="Total Codes"
          value="1,432"
          icon={CreditCard}
          trend={{ value: "+8% from last month", isPositive: true }}
        />
        <StatCard
          title="Active Services"
          value="6"
          icon={Zap}
        />
        <StatCard
          title="This Month"
          value="42"
          icon={Users}
          trend={{ value: "+18% from last month", isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-6">Clients per Service</h3>
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
        </Card>

        <ActivityFeed activities={recentActivities} />
      </div>

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
