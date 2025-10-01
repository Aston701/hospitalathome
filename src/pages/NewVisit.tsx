import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar } from "lucide-react";

const NewVisit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preSelectedPatient = searchParams.get("patient");
  
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [medicalBoxes, setMedicalBoxes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patient_id: preSelectedPatient || "",
    scheduled_date: "",
    scheduled_time: "",
    duration: "60",
    nurse_id: "",
    doctor_id: "",
    medical_box_id: "",
    priority: "routine" as "routine" | "urgent" | "emergency",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch patients
      const { data: patientsData } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone")
        .order("first_name");
      
      // Fetch nurses
      const { data: nursesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "nurse")
        .eq("is_active", true)
        .order("full_name");
      
      // Fetch doctors
      const { data: doctorsData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "doctor")
        .eq("is_active", true)
        .order("full_name");

      // Fetch available medical boxes
      const { data: boxesData } = await supabase
        .from("medical_boxes")
        .select("id, label, status")
        .eq("status", "in_service")
        .order("label");

      setPatients(patientsData || []);
      setNurses(nursesData || []);
      setDoctors(doctorsData || []);
      setMedicalBoxes(boxesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Combine date and time into proper timestamps
      const scheduledStart = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      const scheduledEnd = new Date(scheduledStart.getTime() + parseInt(formData.duration) * 60000);

      const { data, error } = await supabase
        .from("visits")
        .insert([{
          patient_id: formData.patient_id,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          nurse_id: formData.nurse_id || null,
          doctor_id: formData.doctor_id || null,
          medical_box_id: formData.medical_box_id || null,
          notes: formData.notes || null,
          status: "scheduled",
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Create dispatch event
      if (formData.nurse_id) {
        await supabase
          .from("dispatch_events")
          .insert([{
            visit_id: data.id,
            type: "assigned",
            created_by: user.id
          }]);
      }

      toast({
        title: "Visit scheduled",
        description: "The visit has been successfully scheduled."
      });

      navigate(`/visits/${data.id}`);
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

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Schedule Visit</h1>
          <p className="text-muted-foreground">Create a new home visit appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Select the patient for this visit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(value) => handleChange("patient_id", value)}
                required
                disabled={loading || !!preSelectedPatient}
              >
                <SelectTrigger id="patient_id">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
            <CardDescription>Set the visit date, time and duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  min={today}
                  value={formData.scheduled_date}
                  onChange={(e) => handleChange("scheduled_date", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Time *</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => handleChange("scheduled_time", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleChange("duration", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Team & Resources</CardTitle>
            <CardDescription>Assign nurse, doctor and medical equipment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nurse_id">Assigned Nurse</Label>
                <Select
                  value={formData.nurse_id}
                  onValueChange={(value) => handleChange("nurse_id", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="nurse_id">
                    <SelectValue placeholder="Select a nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {nurses.map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {nurse.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor_id">On-Call Doctor</Label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => handleChange("doctor_id", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="doctor_id">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_box_id">Medical Box</Label>
              <Select
                value={formData.medical_box_id}
                onValueChange={(value) => handleChange("medical_box_id", value)}
                disabled={loading}
              >
                <SelectTrigger id="medical_box_id">
                  <SelectValue placeholder="Select a medical box" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {medicalBoxes.map((box) => (
                    <SelectItem key={box.id} value={box.id}>
                      {box.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tablet and vitals monitoring devices
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Notes and special instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Visit Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
                placeholder="Special instructions, patient requests, or other important information..."
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Scheduling..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Schedule Visit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewVisit;