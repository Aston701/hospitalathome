import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MedicalDocumentsDisplayProps {
  visitId: string;
}

export function MedicalDocumentsDisplay({ visitId }: MedicalDocumentsDisplayProps) {
  const [diagnosticRequests, setDiagnosticRequests] = useState<any[]>([]);
  const [sickNotes, setSickNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [visitId]);

  const fetchDocuments = async () => {
    try {
      const [diagRes, sickRes] = await Promise.all([
        supabase
          .from("diagnostic_requests")
          .select("*")
          .eq("visit_id", visitId)
          .order("created_at", { ascending: false }),
        supabase
          .from("sick_notes")
          .select("*")
          .eq("visit_id", visitId)
          .order("created_at", { ascending: false }),
      ]);

      // Fetch user profiles for the requests
      const diagUserIds = diagRes.data?.map(d => d.requested_by).filter(Boolean) || [];
      const sickUserIds = sickRes.data?.map(s => s.issued_by).filter(Boolean) || [];
      const allUserIds = [...new Set([...diagUserIds, ...sickUserIds])];

      let userProfiles: Record<string, any> = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", allUserIds);
        
        profiles?.forEach(p => {
          userProfiles[p.id] = p;
        });
      }

      // Attach profile data to requests
      const diagWithProfiles = diagRes.data?.map(d => ({
        ...d,
        requested_by_profile: userProfiles[d.requested_by]
      })) || [];

      const sickWithProfiles = sickRes.data?.map(s => ({
        ...s,
        issued_by_profile: userProfiles[s.issued_by]
      })) || [];

      setDiagnosticRequests(diagWithProfiles);
      setSickNotes(sickWithProfiles);
    } catch (error) {
      console.error("Error fetching medical documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSickNote = async (sickNoteId: string, existingPdfUrl: string | null) => {
    try {
      setGeneratingPdf(sickNoteId);

      // If PDF already exists, download it directly
      if (existingPdfUrl) {
        window.open(existingPdfUrl, '_blank');
        return;
      }

      // Generate new PDF
      const { data, error } = await supabase.functions.invoke('generate-sick-note-pdf', {
        body: { sickNoteId }
      });

      if (error) throw error;

      if (data.pdf_url) {
        toast.success("Sick note PDF generated successfully");
        // Refresh the sick notes to show the new PDF URL
        fetchDocuments();
        // Download the PDF
        window.open(data.pdf_url, '_blank');
      }
    } catch (error) {
      console.error('Error generating sick note PDF:', error);
      toast.error("Failed to generate sick note PDF");
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleDownloadImagingRequest = async (requestId: string, existingPdfUrl: string | null) => {
    try {
      setGeneratingPdf(requestId);

      // If PDF already exists, download it directly
      if (existingPdfUrl) {
        window.open(existingPdfUrl, '_blank');
        return;
      }

      // Generate new PDF
      const { data, error } = await supabase.functions.invoke('generate-imaging-request-pdf', {
        body: { requestId }
      });

      if (error) throw error;

      if (data.pdfUrl) {
        toast.success("Imaging request PDF generated successfully");
        // Refresh the documents to show the new PDF URL
        fetchDocuments();
        // Download the PDF
        window.open(data.pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating imaging request PDF:', error);
      toast.error("Failed to generate imaging request PDF");
    } finally {
      setGeneratingPdf(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading documents...</div>;
  }

  if (diagnosticRequests.length === 0 && sickNotes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {diagnosticRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Diagnostic Test Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosticRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Requested by: {request.requested_by_profile?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={request.status === "pending" ? "outline" : "secondary"}>
                    {request.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Tests Requested:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(request.tests_requested) &&
                      request.tests_requested.map((test: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {test.label}
                        </Badge>
                      ))}
                  </div>
                </div>

                {request.clinical_notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Clinical Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.clinical_notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadImagingRequest(request.id, request.pdf_url)}
                    disabled={generatingPdf === request.id}
                  >
                    {generatingPdf === request.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {request.pdf_url ? 'Download PDF' : 'Generate PDF'}
                      </>
                    )}
                  </Button>
                  
                  {request.pdf_url && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownloadImagingRequest(request.id, null)}
                      disabled={generatingPdf === request.id}
                    >
                      Regenerate PDF
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sickNotes.length > 0 && (
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

                {note.status === "signed" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadSickNote(note.id, note.pdf_url)}
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
                    
                    {note.pdf_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDownloadSickNote(note.id, null)}
                        disabled={generatingPdf === note.id}
                      >
                        Regenerate PDF
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
