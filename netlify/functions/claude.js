exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Anthropic API aanroep
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body.payload)
    });

    const data = await res.json();

    // Als het een evaluatie is (niet een sorteer-aanroep), sla op in Supabase
    if (body.saveToSupabase) {
      const evaluatieTekst = data.content?.map(b => b.text || '').join('') || '';
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/evaluaties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          manager: body.meta.manager,
          opentijd: body.meta.opentijd,
          sluittijd: body.meta.sluittijd,
          memo_verloop: body.meta.memo_verloop,
          memo_algemeen: body.meta.memo_algemeen,
          memo_personeel: body.meta.memo_personeel,
          memo_dj: body.meta.memo_dj,
          memo_lichten: body.meta.memo_lichten,
          memo_veiligheid: body.meta.memo_veiligheid,
          memo_td: body.meta.memo_td,
          evaluatie_tekst: evaluatieTekst
        })
      });
    }

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
