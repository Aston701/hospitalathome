import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Dispatch = () => {
  const { toast } = useToast();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveVisits();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("visits-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visits"
        },
        () => {
          fetchActiveVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveVisits = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, address_line1, city, geo_lat, geo_lng),
          nurse:nurse_id(full_name, phone)
        `)
        .gte("scheduled_start", today.toISOString())
        .in("status", ["scheduled", "assigned", "en_route", "on_site", "in_telemed"])
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "assigned": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "en_route": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "on_site": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "in_telemed": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").split(" ").map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
  };

  const groupedVisits = {
    scheduled: visits.filter(v => v.status === "scheduled"),
    assigned: visits.filter(v => v.status === "assigned"),
    en_route: visits.filter(v => v.status === "en_route"),
    on_site: visits.filter(v => ["on_site", "in_telemed"].includes(v.status))
  };

  const VisitCard = ({ visit }: { visit: any }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              {visit.patient?.first_name} {visit.patient?.last_name}
            </h4>
            <Badge variant="outline" className={getStatusColor(visit.status)}>
              {getStatusLabel(visit.status)}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(visit.scheduled_start), "HH:mm")}</span>
            </div>
            {visit.patient?.address_line1 && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">
                  {visit.patient.address_line1}, {visit.patient.city}
                </span>
              </div>
            )}
            {visit.nurse && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{visit.nurse.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dispatch Board</h1>
        <p className="text-muted-foreground">
          Real-time view of active visits and nurse locations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              Scheduled
              <Badge variant="secondary" className="ml-auto">
                {groupedVisits.scheduled.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <div>
            {groupedVisits.scheduled.map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
            {groupedVisits.scheduled.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No scheduled visits
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              Assigned
              <Badge variant="secondary" className="ml-auto">
                {groupedVisits.assigned.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <div>
            {groupedVisits.assigned.map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
            {groupedVisits.assigned.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No assigned visits
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              En Route
              <Badge variant="secondary" className="ml-auto">
                {groupedVisits.en_route.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <div>
            {groupedVisits.en_route.map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
            {groupedVisits.en_route.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No nurses en route
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              On Site
              <Badge variant="secondary" className="ml-auto">
                {groupedVisits.on_site.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <div>
            {groupedVisits.on_site.map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
            {groupedVisits.on_site.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No visits on site
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dispatch;