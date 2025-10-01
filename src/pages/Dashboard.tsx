import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Activity, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayVisits: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    totalPatients: 0,
    urgent: 0
  });
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  const checkAccessAndFetchData = async () => {
    // Get current user and check role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Redirect nurses to their visits page
    if (profile?.role === "nurse") {
      navigate("/visits");
      return;
    }

    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Build query based on role
      let query = supabase
        .from("visits")
        .select(`
          *,
          patient:patients(first_name, last_name, phone),
          nurse:nurse_id(full_name),
          doctor:doctor_id(full_name)
        `)
        .gte("scheduled_start", today.toISOString())
        .lt("scheduled_start", tomorrow.toISOString())
        .order("scheduled_start", { ascending: true });

      // Nurses only see their assigned visits
      if (profile?.role === "nurse") {
        query = query.eq("nurse_id", user.id);
      }

      const { data: visits } = await query;

      if (visits) {
        setTodayVisits(visits);
        
        // Calculate stats
        const scheduled = visits.filter(v => v.status === "scheduled").length;
        const inProgress = visits.filter(v => 
          ["assigned", "en_route", "on_site", "in_telemed"].includes(v.status)
        ).length;
        const completed = visits.filter(v => v.status === "complete").length;

        setStats(prev => ({
          ...prev,
          todayVisits: visits.length,
          scheduled,
          inProgress,
          completed
        }));
      }

      // Fetch total patients
      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Fetch urgent requests
      const { count: urgentCount } = await supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("priority", "urgent")
        .eq("status", "new");

      setStats(prev => ({
        ...prev,
        totalPatients: patientCount || 0,
        urgent: urgentCount || 0
      }));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of today's operations - {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Visits
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.scheduled} scheduled, {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed visits
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered in system
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-urgent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent Requests
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-urgent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-urgent">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Visits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Visits</CardTitle>
            <Button onClick={() => navigate("/visits")}>View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayVisits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No visits scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/visits/${visit.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">
                        {visit.patient?.first_name} {visit.patient?.last_name}
                      </h3>
                      <Badge variant="outline" className={getStatusColor(visit.status)}>
                        {getStatusLabel(visit.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(visit.scheduled_start), "HH:mm")}
                      </span>
                      {visit.nurse && (
                        <span>Nurse: {visit.nurse.full_name}</span>
                      )}
                      {visit.patient?.phone && (
                        <span>{visit.patient.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;