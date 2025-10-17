import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ConsultationNotesListProps {
  visitId: string;
}

export function ConsultationNotesList({ visitId }: ConsultationNotesListProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [visitId]);

  const fetchNotes = async () => {
    try {
      const { data: notesData, error } = await supabase
        .from("consultation_notes")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for the notes
      const userIds = notesData?.map(n => n.created_by).filter(Boolean) || [];
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
        created_by_profile: userProfiles[n.created_by]
      })) || [];

      setNotes(notesWithProfiles);
    } catch (error) {
      console.error("Error fetching consultation notes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading consultation notes...</div>;
  }

  if (notes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Consultation Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {notes.map((note, index) => (
            <AccordionItem key={note.id} value={`note-${index}`}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 w-full">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {note.created_by_profile?.full_name || "Unknown"}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {note.note_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "PPp")}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  {note.chief_complaint && (
                    <div>
                      <p className="text-sm font-medium mb-1">Chief Complaint</p>
                      <p className="text-sm text-muted-foreground">{note.chief_complaint}</p>
                    </div>
                  )}
                  {note.history_present_illness && (
                    <div>
                      <p className="text-sm font-medium mb-1">History of Present Illness</p>
                      <p className="text-sm text-muted-foreground">{note.history_present_illness}</p>
                    </div>
                  )}
                  {note.past_medical_history && (
                    <div>
                      <p className="text-sm font-medium mb-1">Past Medical History</p>
                      <p className="text-sm text-muted-foreground">{note.past_medical_history}</p>
                    </div>
                  )}
                  {note.current_medications && (
                    <div>
                      <p className="text-sm font-medium mb-1">Current Medications</p>
                      <p className="text-sm text-muted-foreground">{note.current_medications}</p>
                    </div>
                  )}
                  {note.physical_examination && (
                    <div>
                      <p className="text-sm font-medium mb-1">Physical/Virtual Examination</p>
                      <p className="text-sm text-muted-foreground">{note.physical_examination}</p>
                    </div>
                  )}
                  {note.vital_signs_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Vital Signs Notes</p>
                      <p className="text-sm text-muted-foreground">{note.vital_signs_notes}</p>
                    </div>
                  )}
                  {note.assessment && (
                    <div>
                      <p className="text-sm font-medium mb-1">Assessment</p>
                      <p className="text-sm text-muted-foreground">{note.assessment}</p>
                    </div>
                  )}
                  {note.diagnosis && (
                    <div>
                      <p className="text-sm font-medium mb-1">Diagnosis</p>
                      <p className="text-sm text-muted-foreground">{note.diagnosis}</p>
                    </div>
                  )}
                  {note.treatment_plan && (
                    <div>
                      <p className="text-sm font-medium mb-1">Treatment Plan</p>
                      <p className="text-sm text-muted-foreground">{note.treatment_plan}</p>
                    </div>
                  )}
                  {note.prescriptions_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Prescriptions Notes</p>
                      <p className="text-sm text-muted-foreground">{note.prescriptions_notes}</p>
                    </div>
                  )}
                  {note.follow_up_instructions && (
                    <div>
                      <p className="text-sm font-medium mb-1">Follow-up Instructions</p>
                      <p className="text-sm text-muted-foreground">{note.follow_up_instructions}</p>
                    </div>
                  )}
                  {note.additional_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Additional Notes</p>
                      <p className="text-sm text-muted-foreground">{note.additional_notes}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
