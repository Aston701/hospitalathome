import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Loader2, PenLine } from "lucide-react";
import { format } from "date-fns";

interface SickNoteManagerProps {
  visitId: string;
  userRole: string;
}

export function SickNoteManager({ visitId, userRole }: SickNoteManagerProps) {
  const { toast } = useToast();
  const [sickNotes, setSickNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedSickNoteId, setSelectedSickNoteId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    fetchSickNotes();
  }, [visitId]);

  const fetchSickNotes = async () => {
    try {
      const { data: notesData, error } = await supabase
        .from("sick_notes")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for the notes
      const userIds = notesData?.map(n => n.issued_by).filter(Boolean) || [];
      let userProfiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        profiles?.forEach(p => {
          userProfiles[p.id] = p;
        });
      }

      const notesWithProfiles = notesData?.map(n => ({
        ...n,
        issued_by_profile: userProfiles[n.issued_by]
      })) || [];

      setSickNotes(notesWithProfiles);
    } catch (error) {
      console.error("Error fetching sick notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignSickNote = async () => {
    if (!selectedSickNoteId || !signatureName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your name to sign"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("sick_notes")
        .update({
          status: 'signed',
          signature_name: signatureName,
          signature_timestamp: new Date().toISOString(),
          signature_ip: 'system' // In production, you'd get the actual IP
        })
        .eq('id', selectedSickNoteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sick note signed successfully"
      });

      setSignatureDialogOpen(false);
      setSignatureName("");
      setSelectedSickNoteId(null);
      fetchSickNotes();
    } catch (error: any) {
      console.error("Error signing sick note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleDownloadSickNote = async (sickNoteId: string, existingPdfUrl: string | null, signatureTimestamp: string | null) => {
    try {
      setGeneratingPdf(sickNoteId);

      // If there's an existing PDF but it was generated before signing, regenerate it
      const shouldRegenerate = existingPdfUrl && signatureTimestamp && 
        new Date(existingPdfUrl.split('_').pop()?.split('.')[0] || 0).getTime() < new Date(signatureTimestamp).getTime();

      if (existingPdfUrl && !shouldRegenerate) {
        window.open(existingPdfUrl, '_blank');
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-sick-note-pdf', {
        body: { sickNoteId }
      });

      if (error) throw error;

      if (data.pdf_url) {
        toast({
          title: "Success",
          description: "Sick note PDF generated successfully"
        });
        fetchSickNotes();
        window.open(data.pdf_url, '_blank');
      }
    } catch (error) {
      console.error('Error generating sick note PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate sick note PDF"
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading sick notes...</div>;
  }

  if (sickNotes.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sick Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sickNotes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Issued by: {note.issued_by_profile?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "PPp")}
                    </p>
                  </div>
                </div>
                <Badge variant={note.status === "signed" ? "default" : "outline"}>
                  {note.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Diagnosis:</p>
                  <p className="font-medium">{note.diagnosis}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration:</p>
                  <p className="font-medium">{note.days_duration} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date:</p>
                  <p className="font-medium">
                    {format(new Date(note.start_date), "PP")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date:</p>
                  <p className="font-medium">
                    {format(new Date(note.end_date), "PP")}
                  </p>
                </div>
              </div>

              {note.additional_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Additional Notes:</p>
                  <p className="text-sm text-muted-foreground">{note.additional_notes}</p>
                </div>
              )}

              {note.status === "signed" && note.signature_name && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium mb-1">Signed by:</p>
                  <p className="text-sm text-muted-foreground">{note.signature_name}</p>
                  {note.signature_timestamp && (
                    <p className="text-xs text-muted-foreground">
                      on {format(new Date(note.signature_timestamp), "PPp")}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {note.status === "draft" && userRole === "doctor" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedSickNoteId(note.id);
                      setSignatureDialogOpen(true);
                    }}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Sign & Approve
                  </Button>
                )}

                {note.status === "signed" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadSickNote(note.id, note.pdf_url, note.signature_timestamp)}
                    disabled={generatingPdf === note.id}
                  >
                    {generatingPdf === note.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {note.pdf_url ? 'Download PDF' : 'Generate PDF'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Sick Note</DialogTitle>
            <DialogDescription>
              Please enter your full name to electronically sign this sick note.
              By signing, you certify the accuracy of the information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signature-name">Full Name (Signature)</Label>
              <Input
                id="signature-name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignSickNote}>
              Sign & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
