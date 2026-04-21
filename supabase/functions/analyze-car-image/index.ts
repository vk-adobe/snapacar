// Deno Deploy / Supabase Edge Function — wire to Google Cloud Vision API.
// Set secrets: GOOGLE_CLOUD_API_KEY or use service account JWT.
// Deploy: supabase functions deploy analyze-car-image --no-verify-jwt
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'missing image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          plateGuess: null,
          labels: [],
          hints: {},
          message: 'Set GOOGLE_CLOUD_API_KEY secret for OCR',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [
                { type: 'TEXT_DETECTION', maxResults: 10 },
                { type: 'LABEL_DETECTION', maxResults: 8 },
              ],
            },
          ],
        }),
      }
    );
    const visionJson = await visionRes.json();
    const ann = visionJson?.responses?.[0];
    const text = ann?.fullTextAnnotation?.text || '';
    const labels =
      ann?.labelAnnotations?.map((l: { description: string }) => l.description) || [];
    const plateGuess = extractPlateLike(text);
    const hints = inferMakeModelFromLabels(labels);
    return new Response(JSON.stringify({ plateGuess, labels, hints, textSnippet: text.slice(0, 500) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

function extractPlateLike(text: string): string | null {
  const lines = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  for (const line of lines) {
    const compact = line.replace(/[\s-]/g, '').toUpperCase();
    if (/^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/.test(compact)) return compact;
    if (/^[0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]{2}$/.test(compact)) return compact;
    if (compact.length >= 6 && compact.length <= 12 && /^[A-Z0-9]+$/.test(compact)) return compact;
  }
  return null;
}

function inferMakeModelFromLabels(labels: string[]): { make?: string; model?: string } {
  const low = labels.map((l) => l.toLowerCase()).join(' ');
  const makes = ['toyota', 'honda', 'ford', 'bmw', 'audi', 'mercedes', 'tesla', 'hyundai', 'kia'];
  for (const m of makes) {
    if (low.includes(m)) return { make: m.charAt(0).toUpperCase() + m.slice(1) };
  }
  return {};
}
