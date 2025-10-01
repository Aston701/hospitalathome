import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Prescriptions = () => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          visit:visits(
            patient:patients(first_name, last_name)
          ),
          doctor:doctor_id(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
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
      case "draft": return "bg-secondary text-secondary-foreground";
      case "signed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "sent_to_patient": return "bg-success/10 text-success border-success/20";
      case "sent_to_pharmacy": return "bg-primary/10 text-primary border-primary/20";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Prescriptions</h1>
        <p className="text-muted-foreground">
          View and manage all prescriptions
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No prescriptions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">
                        {prescription.visit?.patient?.first_name}{" "}
                        {prescription.visit?.patient?.last_name}
                      </h3>
                      <Badge variant="outline" className={getStatusColor(prescription.status)}>
                        {prescription.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(prescription.created_at), "dd MMM yyyy")}</span>
                      </div>
                      {prescription.doctor && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Dr. {prescription.doctor.full_name}</span>
                        </div>
                      )}
                    </div>

                    {prescription.items && prescription.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <div className="space-y-1">
                          {prescription.items.slice(0, 3).map((item: any, idx: number) => (
                            <p key={idx} className="text-sm text-muted-foreground">
                              • {item.drug} - {item.dose}
                            </p>
                          ))}
                          {prescription.items.length > 3 && (
                            <p className="text-sm text-muted-foreground">
                              ... and {prescription.items.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;