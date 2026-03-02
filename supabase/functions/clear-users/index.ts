import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (!tokenData.access_token) throw new Error("Failed to get access token");
  return tokenData.access_token;
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const serviceAccount = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")!);
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID")!;
    const accessToken = await getAccessToken(serviceAccount);
    // Clear all data from Users sheet (keep header row if any)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Users!A:D:clear`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    return new Response(JSON.stringify({ success: true, message: "All users cleared from database", details: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
