import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

const VisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVisit();
    }
  }, [id]);

  const fetchVisit = async () => {
    try {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, address_line1, city),
          nurse:nurse_id(full_name, phone),
          doctor:doctor_id(full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setVisit(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground">Visit not found</p>
        <Button onClick={() => navigate("/visits")} className="mt-4">
          Back to Visits
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/visits")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Visit Details</h1>
            <p className="text-muted-foreground">
              {visit.patient?.first_name} {visit.patient?.last_name}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={getStatusColor(visit.status)}>
          {visit.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(visit.scheduled_start), "dd MMMM yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {format(new Date(visit.scheduled_start), "HH:mm")} -{" "}
                  {format(new Date(visit.scheduled_end), "HH:mm")}
                </p>
              </div>
            </div>
          </div>

          {visit.patient?.address_line1 && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">
                  {visit.patient.address_line1}
                  {visit.patient.city && `, ${visit.patient.city}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(visit.nurse || visit.doctor) && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visit.nurse && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nurse</p>
                  <p className="font-medium">{visit.nurse.full_name}</p>
                  {visit.nurse.phone && (
                    <p className="text-sm text-muted-foreground">{visit.nurse.phone}</p>
                  )}
                </div>
              </div>
            )}
            {visit.doctor && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Doctor</p>
                  <p className="font-medium">Dr. {visit.doctor.full_name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {visit.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Visit Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{visit.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisitDetail;