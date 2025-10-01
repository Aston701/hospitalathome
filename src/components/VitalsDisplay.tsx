import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Thermometer, Wind } from "lucide-react";
import { format } from "date-fns";

interface VitalsDisplayProps {
  visitId: string;
}

const VitalsDisplay = ({ visitId }: VitalsDisplayProps) => {
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVitals();
  }, [visitId]);

  const fetchVitals = async () => {
    try {
      const { data, error } = await supabase
        .from("vitals_readings")
        .select(`
          *,
          nurse:captured_by_user_id(full_name)
        `)
        .eq("visit_id", visitId)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setVitals(data || []);
    } catch (error) {
      console.error("Error fetching vitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVitalIcon = (type: string) => {
    switch (type) {
      case "blood_pressure":
        return Activity;
      case "heart_rate":
        return Heart;
      case "temperature":
        return Thermometer;
      case "oxygen_saturation":
      case "respiratory_rate":
        return Wind;
      default:
        return Activity;
    }
  };

  const formatVitalValue = (vital: any) => {
    if (vital.type === "blood_pressure") {
      return `${vital.raw_payload?.systolic || vital.value_number}/${vital.raw_payload?.diastolic || "-"} ${vital.unit}`;
    }
    return `${vital.value_number} ${vital.unit}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vitals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vitals.map((vital) => {
            const Icon = getVitalIcon(vital.type);
            return (
              <div key={vital.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card">
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium capitalize">
                        {vital.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatVitalValue(vital)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recorded by {vital.nurse?.full_name || "Unknown"} on{" "}
                        {format(new Date(vital.timestamp), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                    {vital.raw_payload?.photo_url && (
                      <a
                        href={vital.raw_payload.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Photo
                      </a>
                    )}
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

export default VitalsDisplay;
