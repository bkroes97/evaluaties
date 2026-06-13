exports.handler = async (event) => {
  // Alleen GET
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { locatie, manager, limit = 200 } = event.queryStringParameters || {};

    // Bouw de Supabase query op
    let url = `${process.env.SUPABASE_URL}/rest/v1/evaluaties?select=*&order=created_at.desc&limit=${limit}`;
    if (locatie) url += `&locatie=eq.${encodeURIComponent(locatie)}`;
    if (manager) url += `&manager=eq.${encodeURIComponent(manager)}`;

    const res = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[evaluaties.js] Supabase fout:', res.status, errText);
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: 'Supabase fout', detail: errText })
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('[evaluaties.js] Handler fout:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
