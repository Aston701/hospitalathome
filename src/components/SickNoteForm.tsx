import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Calendar as CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface SickNoteFormProps {
  visitId: string;
  patientId: string;
  patientName: string;
  canCreate: boolean;
}

export function SickNoteForm({
  visitId,
  patientId,
  patientName,
  canCreate,
}: SickNoteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDays = () => {
    if (startDate && endDate) {
      return differenceInDays(endDate, startDate) + 1;
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      toast.error("Please enter a diagnosis");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);
    try {
      const daysDuration = calculateDays();

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("sick_notes").insert({
        visit_id: visitId,
        patient_id: patientId,
        issued_by: user?.id || "",
        diagnosis: diagnosis,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        days_duration: daysDuration,
        additional_notes: additionalNotes,
      });

      if (error) throw error;

      toast.success("Sick note created successfully");
      setIsOpen(false);
      setDiagnosis("");
      setStartDate(undefined);
      setEndDate(undefined);
      setAdditionalNotes("");
    } catch (error) {
      console.error("Error creating sick note:", error);
      toast.error("Failed to create sick note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Generate Sick Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Sick Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Patient: <span className="font-medium text-foreground">{patientName}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis / Condition *</Label>
            <Input
              id="diagnosis"
              placeholder="Enter diagnosis or condition"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {startDate && endDate && (
            <div className="text-sm text-muted-foreground">
              Duration: <span className="font-medium text-foreground">{calculateDays()} days</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="additional-notes">Additional Notes</Label>
            <Textarea
              id="additional-notes"
              placeholder="Any additional notes or recommendations..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Sick Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
