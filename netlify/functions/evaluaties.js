exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { locatie, manager, limit = 200 } = event.queryStringParameters || {};

    // Sorteer op id desc (werkt altijd), geen created_at nodig
    let url = `${process.env.SUPABASE_URL}/rest/v1/evaluaties?select=*&order=id.desc&limit=${limit}`;
    if (locatie) url += `&locatie=eq.${encodeURIComponent(locatie)}`;
    if (manager) url += `&manager=eq.${encodeURIComponent(manager)}`;

    console.log('[evaluaties.js] URL:', url);

    const res = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await res.text();
    console.log('[evaluaties.js] Supabase status:', res.status, responseText.substring(0, 300));

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Supabase fout', detail: responseText })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: responseText
    };

  } catch (err) {
    console.error('[evaluaties.js] Handler fout:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
