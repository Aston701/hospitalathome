import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  webhookUrl: string;
  notificationType: string;
  subject: string;
  message: string;
  recipientEmail?: string;
  recipientName?: string;
  additionalData?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      webhookUrl, 
      notificationType, 
      subject, 
      message, 
      recipientEmail,
      recipientName,
      additionalData 
    }: NotificationRequest = await req.json();

    console.log('Triggering Zapier notification:', { notificationType, subject });

    // Send data to Zapier webhook
    const zapierResponse = await fetch(webhookUrl, {
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
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
