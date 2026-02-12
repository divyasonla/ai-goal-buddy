import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const unsignedToken = `${header}.${payload}`;
  const pemContent = serviceAccount.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken));
  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedToken}`,
  });
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) throw new Error(`Failed to get access token`);
  return tokenData.access_token;
}

async function getSheetData(accessToken: string, sheetId: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.values || [];
}

async function appendSheetData(accessToken: string, sheetId: string, range: string, values: string[][]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, username } = await req.json();
    const serviceAccount = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")!);
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    
    const accessToken = await getAccessToken(serviceAccount);

    // Fetch daily goals from the last 7 days
    const rows = await getSheetData(accessToken, sheetId, "DailyGoals!A:I");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userGoals = rows
      .filter((row: string[]) => row[1] === email)
      .filter((row: string[]) => {
        const goalDate = new Date(row[7]);
        return goalDate >= sevenDaysAgo;
      });

    const totalGoals = userGoals.length;
    const completedGoals = userGoals.filter((g: string[]) => g[8] === "Completed").length;
    const completionPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const mainChallenges = userGoals.map((g: string[]) => g[5]).filter(Boolean).join("; ");

    // Generate AI feedback
    const prompt = `You are an educational coach analyzing a student's weekly goal progress. Here is the data:

Student: ${username}
Total goals this week: ${totalGoals}
Completed goals: ${completedGoals}
Completion rate: ${completionPercent}%
Goals details:
${userGoals.map((g: string[]) => `- Goal: "${g[2]}" | Status: ${g[8]} | Went Well: "${g[4]}" | Challenges: "${g[5]}"`).join("\n")}

Please provide a personalized weekly report with:
1. A brief summary of their progress
2. Analysis of what went well
3. Analysis of challenges and how to overcome them
4. Specific, actionable improvement suggestions
5. Encouraging closing remarks

Keep it concise, warm, and actionable (max 300 words).`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a supportive educational coach that provides constructive feedback on student goal progress." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const aiFeedback = aiData.choices?.[0]?.message?.content || "Unable to generate feedback.";

    // Get current week
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const weekNum = Math.ceil((diff / 604800000) + 1);
    const currentWeek = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

    // Save report to WeeklyReports sheet
    await appendSheetData(accessToken, sheetId, "WeeklyReports!A:G", [
      [username, email, currentWeek, String(completionPercent), mainChallenges, aiFeedback, new Date().toISOString()],
    ]);

    return new Response(JSON.stringify({
      success: true,
      report: {
        username, email, week: currentWeek,
        completionPercent, mainChallenges, aiFeedback,
        totalGoals, completedGoals,
        createdAt: new Date().toISOString(),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
