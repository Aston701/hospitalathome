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
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

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

      // Generate signed URLs for photos
      const urls: Record<string, string> = {};
      for (const vital of data || []) {
        const payload = vital.raw_payload as any;
        if (payload?.photo_url) {
          // Extract the file path from the full URL
          const urlPath = payload.photo_url.split('/visit-photos/')[1];
          if (urlPath) {
            const { data: signedData } = await supabase.storage
              .from('visit-photos')
              .createSignedUrl(urlPath, 3600); // Valid for 1 hour
            
            if (signedData?.signedUrl) {
              urls[vital.id] = signedData.signedUrl;
            }
          }
        }
      }
      setPhotoUrls(urls);
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
    const payload = vital.raw_payload as any;
    if (vital.type === "blood_pressure") {
      return `${payload?.systolic || vital.value_number}/${payload?.diastolic || "-"} ${vital.unit}`;
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
                    {photoUrls[vital.id] && (
                      <a
                        href={photoUrls[vital.id]}
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
