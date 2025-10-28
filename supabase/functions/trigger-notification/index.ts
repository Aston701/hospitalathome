import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const notificationSchema = z.object({
  notificationType: z.string().max(50),
  subject: z.string().max(200),
  message: z.string().max(10000),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(100).optional(),
  additionalData: z.record(z.any()).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate input
    const rawData = await req.json();
    const { 
      notificationType, 
      subject, 
      message, 
      recipientEmail,
      recipientName,
      additionalData 
    } = notificationSchema.parse(rawData);

    console.log('Triggering notification:', { notificationType, subject });

    // Fetch webhook URL from system settings (admin-controlled)
    const { data: settings, error: settingsError } = await supabaseClient
      .from('system_settings')
      .select('zapier_webhook_url')
      .single();

    if (settingsError || !settings?.zapier_webhook_url) {
      console.error('Webhook not configured:', settingsError);
      throw new Error('Notification webhook not configured. Please configure it in system settings.');
    }

    // Send data to configured webhook only
    const zapierResponse = await fetch(settings.zapier_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_type: notificationType,
        subject,
        message,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        timestamp: new Date().toISOString(),
        ...additionalData,
      }),
    });

    console.log('Zapier webhook response status:', zapierResponse.status);

    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook failed with status: ${zapierResponse.status}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notification triggered successfully' 
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in trigger-notification function:', error);
    
    // Return sanitized error message
    let clientMessage = 'Failed to send notification';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      clientMessage = 'Invalid notification data';
      statusCode = 400;
    } else if (error.message?.includes('not configured')) {
      clientMessage = error.message;
      statusCode = 500;
    }

    return new Response(
      JSON.stringify({ 
        error: clientMessage,
        success: false 
      }),
      {
        status: statusCode,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
