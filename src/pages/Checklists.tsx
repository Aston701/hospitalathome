import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ClipboardList, Send, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ChecklistSection {
  title: string;
  items: Array<{
    id: string;
    label: string;
    type: 'yesno' | 'comment';
  }>;
  columns: string[];
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  sections: ChecklistSection[];
  order_index: number;
}

interface ChecklistSubmission {
  id: string;
  template_id: string;
  staff_name: string;
  shift: string;
  submitted_at: string;
  responses: Record<string, any>;
  signature_name: string;
  pdf_url: string | null;
}

const Checklists = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});
  
  // Form state
  const [staffName, setStaffName] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [signatureName, setSignatureName] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);

      // Get user profile to check role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setUserRole(profileData.role);
        }
      }

      const { data: templatesData, error: templatesError } = await supabase
        .from("checklist_templates" as any)
        .select("*")
        .order("order_index");

      if (templatesError) throw templatesError;
      setTemplates((templatesData as any) || []);

      if (templatesData && templatesData.length > 0) {
        setActiveTab((templatesData as any)[0].id);
        // Open all sections by default
        const sectionsState: Record<string, boolean> = {};
        (templatesData as any).forEach((template: any) => {
          template.sections?.forEach((section: any, idx: number) => {
            sectionsState[`${template.id}-${idx}`] = true;
          });
        });
        setOpenSections(sectionsState);
      }

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

  const handleResponseChange = (itemId: string, value: any) => {
    setResponses({ ...responses, [itemId]: value });
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections({ ...openSections, [sectionId]: !openSections[sectionId] });
  };

  const resetForm = () => {
    setStaffName("");
    setResponses({});
    setSignatureName("");
  };

  const handleSubmit = async (templateId: string) => {
    try {
      if (!staffName || !signatureName) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("checklist_submissions" as any)
        .insert({
          template_id: templateId,
          user_id: user.id,
          staff_name: staffName,
          responses: responses,
          signature_name: signatureName,
        } as any);

      if (error) throw error;

      // Check if any answers are "no"
      const hasNoAnswers = Object.values(responses).some(
        (response: any) => response?.status === "no"
      );

      if (hasNoAnswers) {
        // Get user profile for webhook URL
        const { data: profileData } = await supabase
          .from("profiles")
          .select("zapier_webhook_url")
          .eq("id", user.id)
          .single();

        if (profileData?.zapier_webhook_url) {
          const template = templates.find(t => t.id === templateId);
          const noItems: string[] = [];
          
          // Collect items with "no" answers
          Object.entries(responses).forEach(([itemId, response]: [string, any]) => {
            if (response?.status === "no") {
              template?.sections?.forEach((section) => {
                section.items?.forEach((item) => {
                  if (item.id === itemId) {
                    noItems.push(`${item.label}${response.comment ? `: ${response.comment}` : ''}`);
                  }
                });
              });
            }
          });

          // Trigger notification via Zapier
          await supabase.functions.invoke('trigger-notification', {
            body: {
              webhookUrl: profileData.zapier_webhook_url,
              notificationType: 'checklist_alert',
              subject: `Equipment Checklist Alert - ${template?.name}`,
              message: `The following equipment issues were reported by ${staffName}:\n\n${noItems.join('\n')}`,
              recipientEmail: 'aston@mediresponse.co,sam@mediresponse.co',
              recipientName: 'Management Team',
              additionalData: {
                checklistName: template?.name,
                staffName: staffName,
                submittedAt: new Date().toISOString(),
                issues: noItems,
                responses: responses
              }
            }
          });
        }
      }

      toast({
        title: "Success",
        description: "Checklist submitted successfully",
      });

      resetForm();
      await fetchChecklists();
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

  const toggleSubmissionExpand = (submissionId: string) => {
    setExpandedSubmissions({
      ...expandedSubmissions,
      [submissionId]: !expandedSubmissions[submissionId],
    });
  };

  const isViewOnlyRole = userRole === "admin" || userRole === "control_room";

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
          <h1 className="text-3xl font-bold">Equipment Checklists</h1>
          <p className="text-muted-foreground mt-1">
            Daily equipment verification and maintenance checklists
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {templates.map((template) => (
            <TabsTrigger key={template.id} value={template.id} className="text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{template.name.split(' ')[0]}</span>
              <span className="sm:hidden">
                {template.order_index === 1 ? "Start" : template.order_index === 2 ? "After Use" : "End"}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map((template) => (
          <TabsContent key={template.id} value={template.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show form only for nurses */}
                {!isViewOnlyRole && (
                  <>
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="staff-name">Staff Name *</Label>
                        <Input
                          id="staff-name"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date & Time</Label>
                        <Input value={format(new Date(), "PPpp")} disabled />
                      </div>
                    </div>

                    {/* Checklist Sections */}
                    {template.sections?.map((section, sectionIdx) => {
                  const sectionId = `${template.id}-${sectionIdx}`;
                  return (
                    <Collapsible
                      key={sectionIdx}
                      open={openSections[sectionId]}
                      onOpenChange={() => toggleSection(sectionId)}
                    >
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{section.title}</CardTitle>
                              <ChevronDown
                                className={`h-5 w-5 transition-transform ${
                                  openSections[sectionId] ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-4">
                            {section.items?.map((item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                              >
                                <div className="md:col-span-1">
                                  <Label className="text-sm font-medium">{item.label}</Label>
                                </div>
                                <div className="space-y-2">
                                  {item.type === 'yesno' ? (
                                    <Select
                                      value={responses[item.id]?.status || ""}
                                      onValueChange={(value) =>
                                        handleResponseChange(item.id, {
                                          ...responses[item.id],
                                          status: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Textarea
                                      placeholder="Enter comments..."
                                      value={responses[item.id]?.comment || ""}
                                      onChange={(e) =>
                                        handleResponseChange(item.id, {
                                          comment: e.target.value,
                                        })
                                      }
                                      className="min-h-[80px]"
                                    />
                                  )}
                                </div>
                                {item.type === 'yesno' && responses[item.id]?.status === 'no' && (
                                  <div className="md:col-span-1">
                                    <Textarea
                                      placeholder="Please provide details..."
                                      value={responses[item.id]?.comment || ""}
                                      onChange={(e) =>
                                        handleResponseChange(item.id, {
                                          ...responses[item.id],
                                          comment: e.target.value,
                                        })
                                      }
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}

                    {/* Signature Section */}
                    <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                      <Label htmlFor="signature">Completed and Verified By *</Label>
                      <Input
                        id="signature"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Type your full name to sign"
                      />
                      <Button onClick={() => handleSubmit(template.id)} className="w-full" size="lg">
                        <Send className="h-4 w-4 mr-2" />
                        Submit Checklist
                      </Button>
                    </div>
                  </>
                )}

                {/* Submission History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Submission History</h3>
                  {getSubmissionsForTemplate(template.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No submissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {getSubmissionsForTemplate(template.id).map((submission) => (
                        <Collapsible
                          key={submission.id}
                          open={expandedSubmissions[submission.id]}
                          onOpenChange={() => toggleSubmissionExpand(submission.id)}
                        >
                          <Card>
                            <CollapsibleTrigger className="w-full">
                              <CardContent className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="font-medium">Staff:</span> {submission.staff_name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Date:</span>{" "}
                                        {format(new Date(submission.submitted_at), "PPpp")}
                                      </div>
                                      <div className="col-span-2">
                                        <span className="font-medium">Verified By:</span> {submission.signature_name}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <ChevronDown
                                      className={`h-5 w-5 transition-transform ${
                                        expandedSubmissions[submission.id] ? "rotate-180" : ""
                                      }`}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 px-4 border-t">
                                <div className="space-y-4 mt-4">
                                  <h4 className="font-semibold text-sm">Responses:</h4>
                                  {Object.entries(submission.responses).map(([itemId, response]: [string, any]) => {
                                    // Find the item details from template
                                    let itemLabel = itemId;
                                    template.sections?.forEach((section) => {
                                      section.items?.forEach((item) => {
                                        if (item.id === itemId) {
                                          itemLabel = item.label;
                                        }
                                      });
                                    });

                                    return (
                                      <div key={itemId} className="p-3 bg-secondary/50 rounded-lg text-sm">
                                        <div className="font-medium mb-1">{itemLabel}</div>
                                        {response.status && (
                                          <div className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                                            response.status === 'yes' 
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                          }`}>
                                            {response.status.toUpperCase()}
                                          </div>
                                        )}
                                        {response.comment && (
                                          <div className="mt-2 text-muted-foreground">
                                            <span className="font-medium">Comment:</span> {response.comment}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Checklists;
