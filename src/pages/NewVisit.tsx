import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [dayVisits, setDayVisits] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patient_id: preSelectedPatient || "",
    scheduled_date: undefined as Date | undefined,
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

  useEffect(() => {
    if (formData.scheduled_date) {
      fetchDayVisits();
    }
  }, [formData.scheduled_date]);

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

  const fetchDayVisits = async () => {
    if (!formData.scheduled_date) return;

    try {
      const startOfDay = new Date(formData.scheduled_date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(formData.scheduled_date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          patient:patients(first_name, last_name, phone),
          nurse:nurse_id(full_name),
          doctor:doctor_id(full_name)
        `)
        .gte("scheduled_start", startOfDay.toISOString())
        .lte("scheduled_start", endOfDay.toISOString())
        .order("scheduled_start");

      if (error) throw error;
      setDayVisits(data || []);
    } catch (error: any) {
      console.error("Error fetching day visits:", error);
    }
  };

  const handleChange = (name: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!formData.scheduled_date || !formData.scheduled_time) {
        throw new Error("Please select date and time");
      }

      // Combine date and time into proper timestamps
      const [hours, minutes] = formData.scheduled_time.split(':');
      const scheduledStart = new Date(formData.scheduled_date);
      scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
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
          status: formData.nurse_id ? "assigned" : "scheduled",
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Show loading state while fetching initial data
  if (patients.length === 0 && nurses.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

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
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduled_date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.scheduled_date ? format(formData.scheduled_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.scheduled_date}
                      onSelect={(date) => handleChange("scheduled_date", date)}
                      disabled={(date) => date < today}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scheduled_time"
                    type="time"
                    className="pl-10"
                    value={formData.scheduled_time}
                    onChange={(e) => handleChange("scheduled_time", e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
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

        {/* Schedule Assistant */}
        {formData.scheduled_date && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Assistant
              </CardTitle>
              <CardDescription>
                {dayVisits.length === 0 
                  ? "No visits scheduled for this day yet"
                  : `${dayVisits.length} visit${dayVisits.length !== 1 ? 's' : ''} scheduled for ${format(formData.scheduled_date, "PPP")}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dayVisits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>All time slots are available for this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayVisits.map((visit) => {
                    const start = new Date(visit.scheduled_start);
                    const end = new Date(visit.scheduled_end);
                    return (
                      <div 
                        key={visit.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center bg-background rounded px-3 py-2 border">
                            <span className="text-sm font-semibold">
                              {format(start, "HH:mm")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(end, "HH:mm")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {visit.patient?.first_name} {visit.patient?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {visit.nurse?.full_name || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                            {visit.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                    <SelectValue placeholder="Select a nurse (optional)" />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectValue placeholder="Select a doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectValue placeholder="Select a medical box (optional)" />
                </SelectTrigger>
                <SelectContent>
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