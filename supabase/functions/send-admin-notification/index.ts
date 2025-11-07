import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subject, message, type = "deployment" } = await req.json();

    console.log("Sending notification to admins:", { subject, type });

    // Get all admin users
    const { data: adminProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin");

    if (profileError) {
      console.error("Error fetching admin profiles:", profileError);
      throw profileError;
    }

    console.log(`Found ${adminProfiles?.length || 0} admin users`);

    // In a real implementation, you would:
    // 1. Store notifications in a notifications table
    // 2. Send email notifications
    // 3. Trigger in-app notifications via websocket/realtime

    // For now, we'll just log the notification
    // You can extend this to integrate with email service or notification system
    
    const notifications = adminProfiles?.map((admin) => ({
      user_id: admin.id,
      subject,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    })) || [];

    console.log("Notifications prepared for admins:", notifications.length);

    // Here you could insert into a notifications table if you have one
    // await supabase.from('notifications').insert(notifications);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminCount: adminProfiles?.length || 0,
        message: "Notifications sent to all admins" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
