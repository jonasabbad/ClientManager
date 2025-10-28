import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash2, ArrowRight } from "lucide-react";

interface Activity {
  id: string;
  type: "add" | "edit" | "delete";
  clientName: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  onViewAll?: () => void;
}

const activityConfig = {
  add: { icon: UserPlus, color: "text-chart-4", label: "Added client" },
  edit: { icon: Edit, color: "text-chart-3", label: "Updated client" },
  delete: { icon: Trash2, color: "text-destructive", label: "Deleted client" },
};

export function ActivityFeed({ activities, onViewAll }: ActivityFeedProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            data-testid="button-view-all-activity"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                data-testid={`activity-${activity.id}`}
              >
                <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{config.label}</span>
                    {" "}
                    <span className="text-muted-foreground">{activity.clientName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
