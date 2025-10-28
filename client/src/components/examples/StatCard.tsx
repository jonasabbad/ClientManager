import { StatCard } from "../StatCard";
import { Users, CreditCard, Zap } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}
