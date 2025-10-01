import { format } from "date-fns";
import { CheckCircle, Clock, Navigation, Home, Calendar, User, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  created_by: string | null;
  user?: {
    full_name: string;
  };
}

interface VisitTimelineProps {
  events: TimelineEvent[];
}

const VisitTimeline = ({ events }: VisitTimelineProps) => {
  const getEventIcon = (eventType: string, eventData: any) => {
    if (eventType === "visit_created") {
      return <Calendar className="h-4 w-4" />;
    }
    
    const status = eventData?.new_status || "";
    switch (status) {
      case "en_route":
        return <Navigation className="h-4 w-4" />;
      case "on_site":
        return <Home className="h-4 w-4" />;
      case "complete":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventTitle = (eventType: string, eventData: any) => {
    if (eventType === "visit_created") {
      return "Visit Scheduled";
    }
    
    if (eventType === "status_change") {
      const newStatus = eventData?.new_status || "";
      return `Status changed to ${newStatus.replace(/_/g, " ")}`;
    }
    
    return eventType.replace(/_/g, " ");
  };

  const getEventDescription = (eventType: string, eventData: any) => {
    if (eventType === "visit_created") {
      const scheduledStart = eventData?.scheduled_start;
      if (scheduledStart) {
        return `Scheduled for ${format(new Date(scheduledStart), "dd MMM yyyy, HH:mm")}`;
      }
    }
    
    if (eventType === "status_change") {
      const oldStatus = eventData?.old_status || "";
      const newStatus = eventData?.new_status || "";
      return `Changed from ${oldStatus.replace(/_/g, " ")} to ${newStatus.replace(/_/g, " ")}`;
    }
    
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "assigned": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "en_route": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "on_site": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "in_telemed": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      case "complete": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visit Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No events recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-border" />
          
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {getEventIcon(event.event_type, event.event_data)}
                  </div>
                </div>
                
                {/* Content */}
                <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {getEventTitle(event.event_type, event.event_data)}
                        </p>
                        {event.event_type === "status_change" && event.event_data?.new_status && (
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(event.event_data.new_status)} text-xs`}
                          >
                            {event.event_data.new_status.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      
                      {getEventDescription(event.event_type, event.event_data) && (
                        <p className="text-sm text-muted-foreground">
                          {getEventDescription(event.event_type, event.event_data)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.created_at), "dd MMM yyyy, HH:mm:ss")}
                        </span>
                        {event.user && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.user.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VisitTimeline;
