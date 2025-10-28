import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, User, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { Activity } from "@shared/schema";
import { firestoreService } from "@/lib/firestoreService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RecentActivity() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  const { data: activities, isLoading } = useQuery<any[]>({
    queryKey: ["activities", date?.toISOString()],
    queryFn: () => firestoreService.getAllActivities(),
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return <Badge className="bg-green-500">Created</Badge>;
      case "updated":
        return <Badge className="bg-blue-500">Updated</Badge>;
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>;
      case "code_added":
        return <Badge className="bg-purple-500">Code Added</Badge>;
      case "service_added":
        return <Badge className="bg-emerald-500">Service Added</Badge>;
      case "service_updated":
        return <Badge className="bg-cyan-500">Service Updated</Badge>;
      case "service_deleted":
        return <Badge className="bg-rose-500">Service Deleted</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const filteredActivities = date
    ? activities?.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate.toDateString() === date.toDateString();
      })
    : activities;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Recent Activity</h1>
          <p className="text-muted-foreground mt-2">
            Track all changes and updates to your client database
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-date-picker">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Filter by date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button
              variant="ghost"
              onClick={() => setDate(undefined)}
              data-testid="button-clear-filter"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading activities...</p>
        </Card>
      ) : !filteredActivities || filteredActivities.length === 0 ? (
        <Card className="p-6">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {date ? "No activities found for the selected date" : "No activities yet"}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id} data-testid={`row-activity-${activity.id}`}>
                  <TableCell className="font-mono text-sm" data-testid={`text-time-${activity.id}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-action-${activity.id}`}>
                    {getActionBadge(activity.action)}
                  </TableCell>
                  <TableCell data-testid={`text-client-${activity.id}`}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {activity.clientName}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-description-${activity.id}`}>
                    {activity.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
