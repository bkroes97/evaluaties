exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = event.queryStringParameters || {};
    const locatie = params.locatie;
    const manager = params.manager;
    const eval_id = params.eval_id;
    const limit   = params.limit || '200';

    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const userToken  = authHeader.replace('Bearer ', '').trim();
    const token      = userToken || process.env.SUPABASE_ANON_KEY;

    let url = process.env.SUPABASE_URL + '/rest/v1/evaluaties?select=*&order=aangemaakt_op.desc&limit=' + limit;
    if (eval_id) url += '&id=eq.' + encodeURIComponent(eval_id);
    if (locatie) url += '&locatie=eq.' + encodeURIComponent(locatie);
    if (manager) url += '&manager=eq.' + encodeURIComponent(manager);

    const res = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    const body = await res.text();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Supabase fout', detail: body })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: body
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
