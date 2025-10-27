import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Calendar as CalendarIcon, Clock, MapPin, Navigation, Home, CheckCircle, Pencil, Pill } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import VisitTimeline from "@/components/VisitTimeline";
import VitalsUpload from "@/components/VitalsUpload";
import VitalsDisplay from "@/components/VitalsDisplay";
import PrescriptionManager from "@/components/PrescriptionManager";
import { DiagnosticRequestForm } from "@/components/DiagnosticRequestForm";
import { ImagingRequestForm } from "@/components/ImagingRequestForm";
import { SickNoteForm } from "@/components/SickNoteForm";
import { SickNoteManager } from "@/components/SickNoteManager";
import { ConsultationNotesForm } from "@/components/ConsultationNotesForm";
import { ConsultationNotesList } from "@/components/ConsultationNotesList";
import { MedicalDocumentsDisplay } from "@/components/MedicalDocumentsDisplay";

type VisitStatus = Database["public"]["Enums"]["visit_status"];

const VisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nurses, setNurses] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    scheduled_start: "",
    scheduled_end: "",
    nurse_id: "",
    status: "",
    notes: "",
    teams_meeting_url: "",
    transcription: ""
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchNurses();
    if (id) {
      fetchVisit();
      fetchTimelineEvents();
    }
  }, [id]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      setUserRole(profile?.role || null);
    }
  };


  const fetchNurses = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "nurse")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setNurses(data || []);
    } catch (error: any) {
      console.error("Error fetching nurses:", error);
    }
  };

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

  const fetchTimelineEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("visit_events")
        .select("*, created_by")
        .eq("visit_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user details for each event
      const eventsWithUser = await Promise.all(
        (data || []).map(async (event) => {
          if (event.created_by) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", event.created_by)
              .single();
            
            return {
              ...event,
              user: profile || null
            };
          }
          return { ...event, user: null };
        })
      );
      
      setTimelineEvents(eventsWithUser);
    } catch (error: any) {
      console.error("Error fetching timeline:", error);
    }
  };

  const updateStatus = async (newStatus: VisitStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("visits")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Visit status changed to ${newStatus.replace(/_/g, " ")}`,
      });

      await fetchVisit();
      await fetchTimelineEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setUpdating(false);
    }
  };


  const handleEditVisit = () => {
    setEditFormData({
      scheduled_start: visit.scheduled_start,
      scheduled_end: visit.scheduled_end,
      nurse_id: visit.nurse_id || "unassigned",
      status: visit.status,
      notes: visit.notes || "",
      teams_meeting_url: visit.teams_meeting_url || "",
      transcription: visit.transcription || ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("visits")
        .update({
          scheduled_start: editFormData.scheduled_start,
          scheduled_end: editFormData.scheduled_end,
          nurse_id: editFormData.nurse_id === "unassigned" ? null : editFormData.nurse_id,
          status: editFormData.status as VisitStatus,
          notes: editFormData.notes,
          teams_meeting_url: editFormData.teams_meeting_url,
          transcription: editFormData.transcription
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Visit Updated",
        description: "Visit details have been updated successfully."
      });

      setEditDialogOpen(false);
      await fetchVisit();
      await fetchTimelineEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setUpdating(false);
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

  const canUpdateStatus = visit && currentUserId && (
    visit.nurse_id === currentUserId || 
    userRole === "admin" || 
    userRole === "control_room"
  );

  const getNextStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case "scheduled":
      case "assigned":
        return [
          { value: "en_route" as VisitStatus, label: "En Route", icon: Navigation },
        ];
      case "en_route":
        return [
          { value: "on_site" as VisitStatus, label: "On Site", icon: Home },
        ];
      case "on_site":
        return [
          { value: "complete" as VisitStatus, label: "Complete Visit", icon: CheckCircle },
        ];
      default:
        return [];
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
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
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
        <div className="flex gap-2">
          {userRole !== "nurse" && (
            <Button
              variant="outline"
              onClick={handleEditVisit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Visit
            </Button>
          )}
          <Badge variant="outline" className={getStatusColor(visit.status)}>
            {visit.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
            <DialogDescription>
              Update visit scheduling and assignment details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVisit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start">Start Time *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={editFormData.scheduled_start.slice(0, 16)}
                  onChange={(e) => setEditFormData(prev => ({ 
                    ...prev, 
                    scheduled_start: e.target.value 
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_end">End Time *</Label>
                <Input
                  id="scheduled_end"
                  type="datetime-local"
                  value={editFormData.scheduled_end.slice(0, 16)}
                  onChange={(e) => setEditFormData(prev => ({ 
                    ...prev, 
                    scheduled_end: e.target.value 
                  }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nurse">Assigned Nurse</Label>
              <Select
                value={editFormData.nurse_id}
                onValueChange={(value) => setEditFormData(prev => ({ 
                  ...prev, 
                  nurse_id: value 
                }))}
              >
                <SelectTrigger id="nurse">
                  <SelectValue placeholder="Select a nurse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {nurses.map((nurse) => (
                    <SelectItem key={nurse.id} value={nurse.id}>
                      {nurse.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData(prev => ({ 
                  ...prev, 
                  status: value 
                }))}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="on_site">On Site</SelectItem>
                  <SelectItem value="in_telemed">In Telemed</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teams_meeting_url">Teams Meeting URL</Label>
              <Input
                id="teams_meeting_url"
                type="url"
                placeholder="https://teams.microsoft.com/..."
                value={editFormData.teams_meeting_url}
                onChange={(e) => setEditFormData(prev => ({ 
                  ...prev, 
                  teams_meeting_url: e.target.value 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transcription">Visit Transcription</Label>
              <Textarea
                id="transcription"
                placeholder="Paste the transcription from the visit here..."
                value={editFormData.transcription}
                onChange={(e) => setEditFormData(prev => ({ 
                  ...prev, 
                  transcription: e.target.value 
                }))}
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                Update Visit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
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

      {(visit.teams_meeting_url || visit.transcription) && (
        <Card>
          <CardHeader>
            <CardTitle>Visit Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visit.teams_meeting_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Teams Meeting URL</p>
                <a 
                  href={visit.teams_meeting_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {visit.teams_meeting_url}
                </a>
              </div>
            )}
            {visit.transcription && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Visit Transcription</p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{visit.transcription}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canUpdateStatus && getNextStatuses(visit.status).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {getNextStatuses(visit.status).map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  onClick={() => updateStatus(value)}
                  disabled={updating}
                  size="lg"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {((userRole === "nurse" && visit.nurse_id === currentUserId) || 
        userRole === "admin" || 
        userRole === "control_room") && (
        <VitalsUpload 
          visitId={visit.id} 
          onUploadComplete={() => {
            // Refresh the page data after upload
            fetchVisit();
          }} 
        />
      )}

      <VitalsDisplay visitId={visit.id} />

      <SickNoteManager
        visitId={visit.id}
        userRole={userRole || ""}
      />

      <ConsultationNotesList visitId={visit.id} refreshTrigger={notesRefreshTrigger} />

      {(userRole === "doctor" || userRole === "nurse") && (
        <ConsultationNotesForm 
          visitId={visit.id} 
          onSuccess={() => setNotesRefreshTrigger(prev => prev + 1)} 
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Medical Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-6">
            <ImagingRequestForm
              visitId={visit.id}
              patientId={visit.patient_id}
              patientName={`${visit.patient?.first_name} ${visit.patient?.last_name}`}
              canCreate={
                (userRole === "doctor" && visit.doctor_id === currentUserId) ||
                (userRole === "nurse" && visit.nurse_id === currentUserId) ||
                userRole === "admin" ||
                userRole === "control_room"
              }
            />
            <DiagnosticRequestForm
              visitId={visit.id}
              patientId={visit.patient_id}
              patientName={`${visit.patient?.first_name} ${visit.patient?.last_name}`}
              canCreate={
                (userRole === "doctor" && visit.doctor_id === currentUserId) ||
                (userRole === "nurse" && visit.nurse_id === currentUserId) ||
                userRole === "admin" ||
                userRole === "control_room"
              }
            />
            <SickNoteForm
              visitId={visit.id}
              patientId={visit.patient_id}
              patientName={`${visit.patient?.first_name} ${visit.patient?.last_name}`}
              canCreate={
                (userRole === "doctor" && visit.doctor_id === currentUserId) ||
                (userRole === "nurse" && visit.nurse_id === currentUserId) ||
                userRole === "admin" ||
                userRole === "control_room"
              }
            />
            {(userRole === "nurse" || userRole === "doctor" || userRole === "admin" || userRole === "control_room") && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const { data: visitData } = await supabase
                      .from("visits")
                      .select("doctor_id")
                      .eq("id", visit.id)
                      .single();

                    if (!visitData?.doctor_id) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "This visit must have a doctor assigned before creating a prescription"
                      });
                      return;
                    }

                    const { data, error } = await supabase
                      .from("prescriptions")
                      .insert({
                        visit_id: visit.id,
                        doctor_id: visitData.doctor_id,
                        items: [],
                        status: "draft",
                      })
                      .select()
                      .single();

                    if (error) throw error;

                    toast({
                      title: "Success",
                      description: "Prescription created"
                    });
                    window.location.reload();
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: error.message
                    });
                  }
                }}
              >
                <Pill className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
            )}
          </div>
          <MedicalDocumentsDisplay 
            visitId={visit.id}
            userRole={userRole || ""}
            currentUserId={currentUserId || ""}
          />
        </CardContent>
      </Card>

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

      <VisitTimeline events={timelineEvents} />
    </div>
  );
};

export default VisitDetail;