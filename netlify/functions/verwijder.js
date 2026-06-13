exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id } = JSON.parse(event.body);
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Geen id meegegeven' }) };

    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/evaluaties?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[verwijder.js] Supabase fout:', res.status, errText);
      return { statusCode: res.status, body: JSON.stringify({ error: errText }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error('[verwijder.js] Handler fout:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
