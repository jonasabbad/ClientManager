import { ActivityFeed } from "../ActivityFeed";

export default function ActivityFeedExample() {
  const activities = [
    { id: "1", type: "add" as const, clientName: "Ahmed El Mansouri", timestamp: "2 minutes ago" },
    { id: "2", type: "edit" as const, clientName: "Fatima Zahra", timestamp: "1 hour ago" },
    { id: "3", type: "delete" as const, clientName: "Youssef Benali", timestamp: "3 hours ago" },
  ];

  return (
    <div className="p-8 max-w-md">
      <ActivityFeed activities={activities} />
    </div>
  );
}
