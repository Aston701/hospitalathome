import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileText, CheckCircle, PenLine } from "lucide-react";

interface PrescriptionItem {
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
}

interface PrescriptionManagerProps {
  visitId: string;
  userRole: string;
  currentUserId: string;
}

const PrescriptionManager = ({ visitId, userRole, currentUserId }: PrescriptionManagerProps) => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrescription, setEditingPrescription] = useState<string | null>(null);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, [visitId]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          doctor:doctor_id(full_name)
        `)
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async () => {
    setEditingPrescription(null);
    setItems([{ drug: "", dose: "", frequency: "", duration: "" }]);
    setPrescriptionDialogOpen(true);
  };

  const handleEditPrescription = (prescription: any) => {
    setEditingPrescription(prescription.id);
    setItems(prescription.items.length > 0 ? prescription.items : [{ drug: "", dose: "", frequency: "", duration: "" }]);
    setPrescriptionDialogOpen(true);
  };

  const handleSavePrescription = async () => {
    try {
      // Filter out empty items
      const validItems = items.filter(
        (item) => item.drug.trim() && item.dose.trim() && item.frequency.trim() && item.duration.trim()
      );

      if (validItems.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please add at least one medication with all fields filled",
        });
        return;
      }

      if (editingPrescription) {
        // Update existing prescription
        const { error } = await supabase
          .from("prescriptions")
          .update({ items: validItems as any })
          .eq("id", editingPrescription);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Prescription updated",
        });
      } else {
        // Create new prescription
        const { data: visit } = await supabase
          .from("visits")
          .select("doctor_id")
          .eq("id", visitId)
          .single();

        if (!visit?.doctor_id) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "This visit must have a doctor assigned before creating a prescription",
          });
          return;
        }

        const { error } = await supabase
          .from("prescriptions")
          .insert({
            visit_id: visitId,
            doctor_id: visit.doctor_id,
            items: validItems as any,
            status: "draft",
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Prescription created",
        });
      }

      setPrescriptionDialogOpen(false);
      setEditingPrescription(null);
      setItems([]);
      fetchPrescriptions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleGeneratePDF = async (prescriptionId: string) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      const { data, error: pdfError } = await supabase.functions.invoke('generate-prescription-pdf', {
        body: { prescriptionId }
      });

      if (pdfError) {
        console.error('PDF Error:', pdfError);
        throw new Error(pdfError.message || 'Failed to generate PDF');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate PDF');
      }

      fetchPrescriptions();

      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error: any) {
      console.error('Generate PDF error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate PDF",
      });
    }
  };

  const handleApprovePrescription = async (prescriptionId: string) => {
    setSelectedPrescriptionId(prescriptionId);
    setSignatureDialogOpen(true);
  };

  const handleSignPrescription = async () => {
    if (!signatureName.trim() || !selectedPrescriptionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your name to sign",
      });
      return;
    }

    try {
      // Get user's IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;

      const { error } = await supabase
        .from("prescriptions")
        .update({
          status: "signed",
          signature_name: signatureName,
          signature_ip: ipAddress,
          signature_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPrescriptionId);

      if (error) throw error;

      // Generate PDF after approval
      await handleGeneratePDF(selectedPrescriptionId);

      setSignatureDialogOpen(false);
      setSignatureName("");
      setSelectedPrescriptionId(null);

      toast({
        title: "Success",
        description: "Prescription approved and signed",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const addItem = () => {
    setItems([...items, { drug: "", dose: "", frequency: "", duration: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-secondary">Draft</Badge>;
      case "signed":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Signed</Badge>;
      case "sent_to_patient":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sent to Patient</Badge>;
      case "sent_to_pharmacy":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Sent to Pharmacy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canEdit = (prescription: any) => {
    if (userRole === "admin" || userRole === "control_room") return true;
    if (userRole === "doctor" && prescription.doctor_id === currentUserId) return true;
    if (userRole === "nurse" && prescription.status === "draft") return true;
    return false;
  };

  const canApprove = (prescription: any) => {
    return (userRole === "doctor" && prescription.doctor_id === currentUserId && prescription.status === "draft");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prescriptions</h3>
        {(userRole === "doctor" || userRole === "nurse") && (
          <Button onClick={handleCreatePrescription} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No prescriptions yet</p>
          {(userRole === "doctor" || userRole === "nurse") && (
            <Button onClick={handleCreatePrescription} className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Prescription
            </Button>
          )}
        </div>
      ) : (
        prescriptions.map((prescription) => (
          <div key={prescription.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold">Prescription</h4>
                {getStatusBadge(prescription.status)}
              </div>
              <div className="flex gap-2">
                {canEdit(prescription) && prescription.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPrescription(prescription)}
                  >
                    Edit
                  </Button>
                )}
                {canApprove(prescription) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprovePrescription(prescription.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Sign
                  </Button>
                )}
              </div>
            </div>

            {prescription.doctor && (
              <p className="text-sm text-muted-foreground">
                Prescribed by: Dr. {prescription.doctor.full_name}
              </p>
            )}

            {prescription.signature_name && (
              <div className="mt-3 p-4 bg-muted/30 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-2">Digital Signature:</p>
                <p className="font-signature text-3xl text-foreground mb-1">
                  {prescription.signature_name}
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Signed: {new Date(prescription.signature_timestamp).toLocaleString()}</p>
                  <p>IP: {prescription.signature_ip}</p>
                </div>
              </div>
            )}

            {prescription.status === 'signed' && (
              <div className="mt-3 flex items-center gap-2">
                {prescription.pdf_url ? (
                  <a
                    href={prescription.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePDF(prescription.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                )}
              </div>
            )}

            {prescription.items.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium">Medications:</p>
                {prescription.items.map((item: PrescriptionItem, idx: number) => (
                  <div key={idx} className="text-sm bg-muted/50 p-3 rounded">
                    <p className="font-medium">{item.drug}</p>
                    <p className="text-muted-foreground">
                      {item.dose} - {item.frequency} for {item.duration}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrescription ? "Edit Prescription" : "New Prescription"}
            </DialogTitle>
            <DialogDescription>
              Add medications with dosage, frequency, and duration details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor={`drug-${index}`}>Medication</Label>
                    <Input
                      id={`drug-${index}`}
                      value={item.drug}
                      onChange={(e) => updateItem(index, "drug", e.target.value)}
                      placeholder="Drug name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`dose-${index}`}>Dose</Label>
                    <Input
                      id={`dose-${index}`}
                      value={item.dose}
                      onChange={(e) => updateItem(index, "dose", e.target.value)}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                    <Input
                      id={`frequency-${index}`}
                      value={item.frequency}
                      onChange={(e) => updateItem(index, "frequency", e.target.value)}
                      placeholder="e.g., twice daily"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`duration-${index}`}>Duration</Label>
                    <Input
                      id={`duration-${index}`}
                      value={item.duration}
                      onChange={(e) => updateItem(index, "duration", e.target.value)}
                      placeholder="e.g., 7 days"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPrescriptionDialogOpen(false);
                setEditingPrescription(null);
                setItems([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePrescription}>
              {editingPrescription ? "Update" : "Create"} Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Sign Prescription
            </DialogTitle>
            <DialogDescription>
              Please enter your full name to digitally sign this prescription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signature-name">Your Full Name</Label>
              <Input
                id="signature-name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g., Dr. John Smith"
                className="font-signature text-2xl"
              />
            </div>
            
            {signatureName && (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <p className="font-signature text-3xl text-foreground">
                  {signatureName}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSignatureDialogOpen(false);
                setSignatureName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSignPrescription}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sign & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionManager;
