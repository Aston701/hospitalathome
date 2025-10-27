import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ClipboardList, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  template_id: string;
  item_text: string;
  order_index: number;
  created_at: string;
}

interface ChecklistCompletion {
  id: string;
  user_id: string;
  template_id: string;
  item_id: string;
  completed_at: string;
  notes: string | null;
}

interface ChecklistSubmission {
  id: string;
  user_id: string;
  template_id: string;
  submitted_at: string;
  notes: string | null;
  completed_items: string[];
}

const Checklists = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("checklist_templates" as any)
        .select("*")
        .order("order_index");

      if (templatesError) throw templatesError;
      setTemplates((templatesData as any) || []);

      if (templatesData && templatesData.length > 0) {
        setActiveTab((templatesData as any)[0].id);
      }

      // Fetch all items
      const { data: itemsData, error: itemsError } = await supabase
        .from("checklist_items" as any)
        .select("*")
        .order("order_index");

      if (itemsError) throw itemsError;
      setItems((itemsData as any) || []);

      // Fetch today's completions for current user
      const today = new Date().toISOString().split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: completionsData, error: completionsError } = await supabase
          .from("checklist_completions" as any)
          .select("*")
          .eq("user_id", user.id)
          .gte("completed_at", `${today}T00:00:00`)
          .lte("completed_at", `${today}T23:59:59`);

        if (completionsError) throw completionsError;
        setCompletions((completionsData as any) || []);
      }

      // Fetch all submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("checklist_submissions" as any)
        .select("*")
        .order("submitted_at", { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions((submissionsData as any) || []);
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

  const isItemCompleted = (itemId: string) => {
    return completions.some((c) => c.item_id === itemId);
  };

  const handleToggleItem = async (itemId: string, templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isCompleted = isItemCompleted(itemId);

      if (isCompleted) {
        // Remove completion
        const completion = completions.find((c) => c.item_id === itemId);
        if (completion) {
          const { error } = await supabase
            .from("checklist_completions" as any)
            .delete()
            .eq("id", completion.id);

          if (error) throw error;

          setCompletions(completions.filter((c) => c.id !== completion.id));
        }
      } else {
        // Add completion
        const { data, error } = await supabase
          .from("checklist_completions" as any)
          .insert({
            user_id: user.id,
            template_id: templateId,
            item_id: itemId,
          } as any)
          .select()
          .single();

        if (error) throw error;
        setCompletions([...completions, data as any]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSubmitChecklist = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const templateItems = items.filter((item) => item.template_id === templateId);
      const completedItemIds = templateItems
        .filter((item) => isItemCompleted(item.id))
        .map((item) => item.id);

      const { error } = await supabase
        .from("checklist_submissions" as any)
        .insert({
          user_id: user.id,
          template_id: templateId,
          notes: notes[templateId] || null,
          completed_items: completedItemIds,
        } as any);

      if (error) throw error;

      // Clear today's completions and notes for this template
      const completionsToDelete = completions.filter((c) => c.template_id === templateId);
      for (const completion of completionsToDelete) {
        await supabase
          .from("checklist_completions" as any)
          .delete()
          .eq("id", completion.id);
      }

      setCompletions(completions.filter((c) => c.template_id !== templateId));
      setNotes({ ...notes, [templateId]: "" });

      // Refresh submissions
      await fetchChecklists();

      toast({
        title: "Success",
        description: "Checklist submitted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getSubmissionsForTemplate = (templateId: string) => {
    return submissions.filter((s) => s.template_id === templateId);
  };

  const getTemplateProgress = (templateId: string) => {
    const templateItems = items.filter((item) => item.template_id === templateId);
    const completedItems = templateItems.filter((item) => isItemCompleted(item.id));
    return {
      completed: completedItems.length,
      total: templateItems.length,
      percentage: templateItems.length > 0 
        ? Math.round((completedItems.length / templateItems.length) * 100)
        : 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Checklists</h1>
          <p className="text-muted-foreground mt-1">
            Daily equipment and cleaning checklists
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {templates.map((template) => {
            const progress = getTemplateProgress(template.id);
            return (
              <TabsTrigger
                key={template.id}
                value={template.id}
                className="relative"
              >
                <div className="flex items-center gap-2">
                  {progress.percentage === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {template.name.split(' ').slice(0, 3).join(' ')}
                  </span>
                  <span className="sm:hidden">
                    {template.order_index === 1 ? "Start" : template.order_index === 2 ? "Visit" : "End"}
                  </span>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {templates.map((template) => {
          const progress = getTemplateProgress(template.id);
          const templateItems = items.filter((item) => item.template_id === template.id);

          return (
            <TabsContent key={template.id} value={template.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {progress.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {progress.completed} of {progress.total} completed
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templateItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <Checkbox
                        id={item.id}
                        checked={isItemCompleted(item.id)}
                        onCheckedChange={() => handleToggleItem(item.id, template.id)}
                        className="mt-1"
                      />
                      <label
                        htmlFor={item.id}
                        className={`flex-1 text-sm font-medium leading-relaxed cursor-pointer ${
                          isItemCompleted(item.id)
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {item.item_text}
                      </label>
                    </div>
                  ))}

                  {progress.percentage === 100 && (
                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">
                          All items checked! Add notes and submit below.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes Section */}
                  <div className="mt-6 space-y-3">
                    <Label htmlFor={`notes-${template.id}`}>Notes (Optional)</Label>
                    <Textarea
                      id={`notes-${template.id}`}
                      placeholder="Add any additional notes or observations..."
                      value={notes[template.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [template.id]: e.target.value })}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={() => handleSubmitChecklist(template.id)}
                      className="w-full"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Checklist
                    </Button>
                  </div>

                  {/* Submission History */}
                  <div className="mt-8 space-y-4">
                    <h3 className="text-lg font-semibold">Submission History</h3>
                    {getSubmissionsForTemplate(template.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No submissions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {getSubmissionsForTemplate(template.id).map((submission) => (
                          <Card key={submission.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">
                                    {format(new Date(submission.submitted_at), "PPpp")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {submission.completed_items.length} items completed
                                  </p>
                                  {submission.notes && (
                                    <p className="text-sm mt-2 p-2 bg-secondary rounded">
                                      {submission.notes}
                                    </p>
                                  )}
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Checklists;
