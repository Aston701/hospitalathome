import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, User, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Visits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      // Get current user and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Build query based on role
      let query = supabase
        .from("visits")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, city),
          nurse:nurse_id(full_name),
          doctor:doctor_id(full_name)
        `)
        .order("scheduled_start", { ascending: false });

      // Nurses only see their assigned visits
      if (profile?.role === "nurse") {
        query = query.eq("nurse_id", user.id);
      }

      const { data, error } = await query;

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
      case "complete": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").split(" ").map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
  };

  const filteredVisits = filter === "all" 
    ? visits 
    : visits.filter(v => v.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Visits</h1>
          <p className="text-muted-foreground">
            View and manage your assigned visits
          </p>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="en_route">En Route</TabsTrigger>
          <TabsTrigger value="on_site">On Site</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
            ) : filteredVisits.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No visits found</p>
                </CardContent>
              </Card>
            ) : (
              filteredVisits.map((visit) => (
                <Card
                  key={visit.id}
                  className="card-hover cursor-pointer"
                  onClick={() => navigate(`/visits/${visit.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">
                            {visit.patient?.first_name} {visit.patient?.last_name}
                          </h3>
                          <Badge variant="outline" className={getStatusColor(visit.status)}>
                            {getStatusLabel(visit.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(visit.scheduled_start), "dd MMM yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(visit.scheduled_start), "HH:mm")} - 
                              {format(new Date(visit.scheduled_end), "HH:mm")}
                            </span>
                          </div>
                          {visit.patient?.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{visit.patient.city}</span>
                            </div>
                          )}
                        </div>

                        {(visit.nurse || visit.doctor) && (
                          <div className="mt-3 pt-3 border-t border-border flex gap-6 text-sm">
                            {visit.nurse && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Nurse: {visit.nurse.full_name}</span>
                              </div>
                            )}
                            {visit.doctor && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Doctor: {visit.doctor.full_name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Visits;