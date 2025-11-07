import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { period, monthlyStats, cumulativeStats, aiMetrics } = await req.json();

    const stats = period === "month" ? monthlyStats : cumulativeStats;
    
    const prompt = `You are an AI analytics assistant for a Hospital at Home division. Analyze the following operational data and provide actionable insights:

Period: ${period === "month" ? "Current Month" : "All Time (Cumulative)"}

Key Metrics:
- Total Visits: ${stats.totalVisits}
- Average Visit Time: ${stats.avgVisitTime} minutes
- New Patients: ${stats.newPatients}
- Average Visits per Patient: ${stats.avgVisitsPerPatient}

AI Metrics:
- Cancellation Rate: ${aiMetrics.cancellationRate}%
- Revisit Rate: ${aiMetrics.revisitRate}%
- Average Response Time: ${aiMetrics.avgResponseTime} minutes (booking to on-site)
- Device Utilization: ${aiMetrics.utilizationRate}%

Top Performers:
${aiMetrics.topPerformers.nurse ? `- Top Nurse: ${aiMetrics.topPerformers.nurse.name} (${aiMetrics.topPerformers.nurse.visits} visits)` : ""}
${aiMetrics.topPerformers.doctor ? `- Top Doctor: ${aiMetrics.topPerformers.doctor.name} (${aiMetrics.topPerformers.doctor.visits} visits)` : ""}

Top Regions:
${aiMetrics.topRegions.map((r: any) => `- ${r.region}: ${r.visits} visits`).join("\n")}

Please provide:
1. Overall performance summary
2. Key trends and patterns
3. Areas of excellence
4. Areas for improvement
5. Specific actionable recommendations

Keep the analysis professional, concise (under 300 words), and focused on actionable insights.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling Lovable AI for analytics insights...");

    const response = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      throw new Error(`Lovable AI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI insights generated successfully");

    const insights = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ insights }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
