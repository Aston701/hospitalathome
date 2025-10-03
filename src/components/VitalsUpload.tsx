import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText } from "lucide-react";

interface VitalsUploadProps {
  visitId: string;
  onUploadComplete: () => void;
}

const VitalsUpload = ({ visitId, onUploadComplete }: VitalsUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [vitalsData, setVitalsData] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    temperature: "",
    oxygen_saturation: "",
    respiratory_rate: "",
    notes: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("User ID:", user.id);
      console.log("Visit ID:", visitId);

      // Upload photo if provided
      let photoPath = null;
      if (photo) {
        console.log("Uploading photo...");
        const fileExt = photo.name.split('.').pop();
        const fileName = `${visitId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('visit-photos')
          .upload(fileName, photo);

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          throw uploadError;
        }

        // Store the file path with bucket prefix for later signed URL generation
        photoPath = `visit-photos/${fileName}`;
        console.log("Photo uploaded successfully, path:", photoPath);
      }

      // Insert vitals readings
      const vitalsToInsert = [];

      if (vitalsData.blood_pressure_systolic && vitalsData.blood_pressure_diastolic) {
        vitalsToInsert.push({
          visit_id: visitId,
          type: 'blood_pressure',
          value_number: parseFloat(vitalsData.blood_pressure_systolic),
          unit: 'mmHg',
          captured_by_user_id: user.id,
          raw_payload: {
            systolic: parseFloat(vitalsData.blood_pressure_systolic),
            diastolic: parseFloat(vitalsData.blood_pressure_diastolic),
            photo_url: photoPath,
            notes: vitalsData.notes || null
          }
        });
      }

      if (vitalsData.heart_rate) {
        vitalsToInsert.push({
          visit_id: visitId,
          type: 'heart_rate',
          value_number: parseFloat(vitalsData.heart_rate),
          unit: 'bpm',
          captured_by_user_id: user.id,
          raw_payload: { 
            photo_url: photoPath,
            notes: vitalsData.notes || null
          }
        });
      }

      if (vitalsData.temperature) {
        vitalsToInsert.push({
          visit_id: visitId,
          type: 'temperature',
          value_number: parseFloat(vitalsData.temperature),
          unit: '°C',
          captured_by_user_id: user.id,
          raw_payload: { 
            photo_url: photoPath,
            notes: vitalsData.notes || null
          }
        });
      }

      if (vitalsData.oxygen_saturation) {
        vitalsToInsert.push({
          visit_id: visitId,
          type: 'oxygen_saturation',
          value_number: parseFloat(vitalsData.oxygen_saturation),
          unit: '%',
          captured_by_user_id: user.id,
          raw_payload: { 
            photo_url: photoPath,
            notes: vitalsData.notes || null
          }
        });
      }

      if (vitalsData.respiratory_rate) {
        vitalsToInsert.push({
          visit_id: visitId,
          type: 'respiratory_rate',
          value_number: parseFloat(vitalsData.respiratory_rate),
          unit: 'breaths/min',
          captured_by_user_id: user.id,
          raw_payload: { 
            photo_url: photoPath,
            notes: vitalsData.notes || null
          }
        });
      }

      console.log("Vitals to insert:", vitalsToInsert);

      if (vitalsToInsert.length > 0) {
        const { error: vitalsError } = await supabase
          .from('vitals_readings')
          .insert(vitalsToInsert);

        if (vitalsError) {
          console.error("Vitals insert error:", vitalsError);
          throw vitalsError;
        }

        // Create timeline event if notes are provided
        if (vitalsData.notes) {
          await supabase
            .from('visit_events')
            .insert({
              visit_id: visitId,
              event_type: 'vitals_recorded',
              event_data: {
                notes: vitalsData.notes,
                vitals_count: vitalsToInsert.length
              },
              created_by: user.id
            });
        }
      }

      toast({
        title: "Vitals Uploaded",
        description: "Patient vitals have been recorded successfully.",
      });

      // Reset form
      setVitalsData({
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: "",
        temperature: "",
        oxygen_saturation: "",
        respiratory_rate: "",
        notes: "",
      });
      setPhoto(null);
      setPhotoPreview(null);
      onUploadComplete();
    } catch (error: any) {
      console.error("Full error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload vitals",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Patient Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bp_systolic">Blood Pressure (Systolic)</Label>
              <Input
                id="bp_systolic"
                type="number"
                placeholder="120"
                value={vitalsData.blood_pressure_systolic}
                onChange={(e) => setVitalsData(prev => ({ ...prev, blood_pressure_systolic: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp_diastolic">Blood Pressure (Diastolic)</Label>
              <Input
                id="bp_diastolic"
                type="number"
                placeholder="80"
                value={vitalsData.blood_pressure_diastolic}
                onChange={(e) => setVitalsData(prev => ({ ...prev, blood_pressure_diastolic: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
              <Input
                id="heart_rate"
                type="number"
                placeholder="72"
                value={vitalsData.heart_rate}
                onChange={(e) => setVitalsData(prev => ({ ...prev, heart_rate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="36.5"
                value={vitalsData.temperature}
                onChange={(e) => setVitalsData(prev => ({ ...prev, temperature: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
              <Input
                id="oxygen"
                type="number"
                placeholder="98"
                value={vitalsData.oxygen_saturation}
                onChange={(e) => setVitalsData(prev => ({ ...prev, oxygen_saturation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="respiratory">Respiratory Rate</Label>
              <Input
                id="respiratory"
                type="number"
                placeholder="16"
                value={vitalsData.respiratory_rate}
                onChange={(e) => setVitalsData(prev => ({ ...prev, respiratory_rate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Assessment Photo</Label>
            <div className="flex items-center gap-3">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="flex-1"
              />
              {photoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-w-full h-48 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any observations or notes about the patient's condition..."
              value={vitalsData.notes}
              onChange={(e) => setVitalsData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              These notes will appear in the visit timeline
            </p>
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Vitals"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VitalsUpload;
