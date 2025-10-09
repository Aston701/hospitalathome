import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2 } from "lucide-react";

const TrainingManuals = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  const manuals = [
    {
      role: "admin",
      title: "Administrator Training Manual",
      description: "Complete guide for system administrators covering user management, patient records, visit scheduling, and system settings.",
      icon: "👨‍💼"
    },
    {
      role: "doctor",
      title: "Doctor Training Manual",
      description: "Comprehensive manual for doctors including prescription management, patient review, and telemedicine consultations.",
      icon: "👨‍⚕️"
    },
    {
      role: "nurse",
      title: "Nurse Training Manual",
      description: "Detailed instructions for nurses on conducting visits, recording vital signs, and documentation procedures.",
      icon: "👩‍⚕️"
    },
    {
      role: "control_room",
      title: "Control Room Training Manual",
      description: "Essential guide for control room operators covering dispatch management, visit coordination, and emergency procedures.",
      icon: "📡"
    }
  ];

  const handleDownload = async (role: string, title: string) => {
    setDownloading(role);
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Fetch the PDF directly as a blob
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-training-manual-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${role}-training-manual.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${title} is being downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading manual:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the training manual. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Training Manuals</h1>
        <p className="text-muted-foreground">
          Download comprehensive training manuals for each user role in the Healthcare Visit Management System.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {manuals.map((manual) => (
          <Card key={manual.role} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{manual.icon}</div>
                  <div>
                    <CardTitle className="text-xl">{manual.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {manual.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleDownload(manual.role, manual.title)}
                  disabled={downloading === manual.role}
                  className="w-full"
                >
                  {downloading === manual.role ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>PDF Format • Comprehensive Guide</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            If you have questions about the training manuals or need additional support, please contact:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Technical Support:</strong> support@healthcare-system.com</li>
            <li>• <strong>Training Questions:</strong> Contact your supervisor or IT Help Desk</li>
            <li>• <strong>Clinical Questions:</strong> Contact Medical Director</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingManuals;
