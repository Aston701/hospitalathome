import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart,
  Shield,
  FileText,
  Plus,
  Edit
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/PatientForm";
import { format } from "date-fns";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch patient's visits
      const { data: visitsData, error: visitsError } = await supabase
        .from("visits")
        .select(`
          *,
          nurse:nurse_id(full_name),
          doctor:doctor_id(full_name)
        `)
        .eq("patient_id", id)
        .order("scheduled_start", { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

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

  const handleUpdatePatient = async (formData: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          ...formData,
          allergies: formData.allergies ? formData.allergies.split(",").map((a: string) => a.trim()) : [],
          conditions: formData.conditions ? formData.conditions.split(",").map((c: string) => c.trim()) : [],
          consent_timestamp: formData.consent_signed && !patient.consent_timestamp 
            ? new Date().toISOString() 
            : patient.consent_timestamp,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Patient updated",
        description: "Patient details have been successfully updated."
      });

      setEditDialogOpen(false);
      fetchPatientData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => navigate("/patients")} className="mt-4">
          Back to Patients
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "assigned": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "complete": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/patients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-muted-foreground">Patient Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Patient
          </Button>
          <Button variant="outline" onClick={() => navigate(`/visits/new?patient=${id}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* Edit Patient Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient Details</DialogTitle>
            <DialogDescription>
              Update patient information and clinical notes
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            initialData={patient}
            onSubmit={handleUpdatePatient}
            loading={saving}
            onCancel={() => setEditDialogOpen(false)}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                </div>
                {patient.date_of_birth && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {format(new Date(patient.date_of_birth), "dd MMM yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {patient.sa_id_number && (
                <div>
                  <p className="text-sm text-muted-foreground">SA ID Number</p>
                  <p className="font-medium">{patient.sa_id_number}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                {patient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          {(patient.address_line1 || patient.city) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {patient.address_line1 && <p>{patient.address_line1}</p>}
                  {patient.address_line2 && <p>{patient.address_line2}</p>}
                  <p>
                    {[patient.suburb, patient.city, patient.province, patient.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="badge-urgent">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {patient.conditions && patient.conditions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map((condition: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {patient.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Clinical Notes</p>
                  <p className="text-sm">{patient.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No visits recorded</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/visits/new?patient=${id}`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule First Visit
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/visits/${visit.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(visit.status)}>
                            {visit.status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(visit.scheduled_start), "dd MMM yyyy, HH:mm")}
                          </span>
                        </div>
                      </div>
                      {(visit.nurse || visit.doctor) && (
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {visit.nurse && <span>Nurse: {visit.nurse.full_name}</span>}
                          {visit.doctor && <span>Doctor: {visit.doctor.full_name}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Medical Aid */}
          {(patient.medical_aid_provider || patient.medical_aid_number) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Medical Aid
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.medical_aid_provider && (
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{patient.medical_aid_provider}</p>
                  </div>
                )}
                {patient.medical_aid_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Member Number</p>
                    <p className="font-medium">{patient.medical_aid_number}</p>
                  </div>
                )}
                {patient.medical_aid_plan && (
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{patient.medical_aid_plan}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Consent Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consent & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.consent_signed ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Consent Signed
                  </Badge>
                  {patient.consent_timestamp && (
                    <p className="text-xs text-muted-foreground">
                      Signed on {format(new Date(patient.consent_timestamp), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="outline" className="badge-urgent">
                    Consent Pending
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Consent required before visit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{visits.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Visits</p>
                <p className="text-2xl font-bold">
                  {visits.filter(v => v.status === "complete").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;