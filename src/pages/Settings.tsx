import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User, Bell, Lock, Database, Webhook } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [visitReminders, setVisitReminders] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSystemSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
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

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("zapier_webhook_url")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();

      if (error) throw error;
      setZapierWebhookUrl(data?.zapier_webhook_url || "");
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
    }
  };

  const handleProfileUpdate = async (field: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (field === "zapier_webhook_url") {
        // Update system settings instead of profile
        const { error } = await supabase
          .from("system_settings")
          .update({ zapier_webhook_url: value })
          .eq("id", "00000000-0000-0000-0000-000000000000");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({ [field]: value })
          .eq("id", user.id);

        if (error) throw error;
        setProfile((prev: any) => ({ ...prev, [field]: value }));
      }
      
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleWebhookTest = async () => {
    if (!zapierWebhookUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a webhook URL first"
      });
      return;
    }

    setTestingWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-notification', {
        body: {
          webhookUrl: zapierWebhookUrl,
          notificationType: 'test',
          subject: 'This is a test from hospital at home',
          message: 'This is a test email.',
          recipientEmail: 'aston@dbsk.co.za',
          recipientName: 'Aston',
          additionalData: {
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test notification sent",
        description: "Check your Zapier workflow to confirm it was received."
      });
    } catch (error: any) {
      console.error('Webhook test error:', error);
      toast({
        variant: "destructive",
        title: "Test failed",
        description: error.message
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile?.full_name || ""}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, full_name: e.target.value }))}
                onBlur={(e) => handleProfileUpdate("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile?.phone || ""}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
                onBlur={(e) => handleProfileUpdate("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={profile?.role || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Contact an administrator to change your role</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates about your visits</p>
              </div>
              <Switch 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Visit Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded before scheduled visits</p>
              </div>
              <Switch 
                checked={visitReminders}
                onCheckedChange={setVisitReminders}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Assignment Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when new visits are assigned to you</p>
              </div>
              <Switch 
                checked={assignmentAlerts}
                onCheckedChange={setAssignmentAlerts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multi-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch
                checked={profile?.mfa_enabled}
                onCheckedChange={(checked) => handleProfileUpdate("mfa_enabled", checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Change Password</Label>
              <Button variant="outline" className="w-full">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Zapier Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Zapier Integration
            </CardTitle>
            <CardDescription>Configure Zapier webhook for email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zapier_webhook">Zapier Webhook URL</Label>
              <Input
                id="zapier_webhook"
                value={zapierWebhookUrl}
                onChange={(e) => setZapierWebhookUrl(e.target.value)}
                onBlur={(e) => handleProfileUpdate("zapier_webhook_url", e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
              <p className="text-xs text-muted-foreground">
                This webhook will be used to send notifications via Zapier to Microsoft 365 Outlook
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleWebhookTest}
              disabled={!zapierWebhookUrl || testingWebhook}
            >
              {testingWebhook ? "Testing..." : "Test Webhook"}
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {profile?.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Download Your Data</Label>
              <p className="text-sm text-muted-foreground">Request a copy of your personal data</p>
              <Button variant="outline" className="w-full">
                Request Data Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
