// ═══════════════════════════════════════════════════════════════
// VOLLARD BLACK — AI Artwork Description Proxy
// File: src/app/api/ai-describe/route.js
//
// Proxies requests to the Anthropic API server-side to avoid
// CORS errors and keep the API key off the client.
//
// ENV VAR required in Vercel:
//   ANTHROPIC_API_KEY — your Anthropic API key
//
// Called by the admin Art Catalogue "AI Describe" button.
// ═══════════════════════════════════════════════════════════════

export const runtime = 'edge';

export async function POST(request) {
  try {
    const { title, artist, medium, dimensions, year, imageUrl } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'AI service not configured.' }, { status: 500 });
    }

    const prompt = [
      'Write a concise, evocative artwork description for a fine art gallery catalogue.',
      'Two to three sentences. Focus on visual qualities, mood, and technique.',
      'Do not mention price. Do not start with "This artwork" or "The artwork".',
      '',
      `Title: ${title || 'Untitled'}`,
      artist ? `Artist: ${artist}` : '',
      medium ? `Medium: ${medium}` : '',
      dimensions ? `Dimensions: ${dimensions}` : '',
      year ? `Year: ${year}` : '',
    ].filter(Boolean).join('\n');

    // Build messages — include image if URL provided
    const userContent = imageUrl
      ? [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: prompt },
        ]
      : prompt;

    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: userContent }],
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json({ error: err.error?.message || 'AI request failed.' }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    return Response.json({ description: text.trim() });
  } catch (err) {
    console.error('AI describe error:', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
