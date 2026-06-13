exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Log het payload voor debuggen
    console.log('[claude.js] payload keys:', Object.keys(body.payload || {}));
    console.log('[claude.js] messages count:', body.payload?.messages?.length);

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

    // Lees de response als tekst eerst, zodat we bij fouten de body kunnen loggen
    const responseText = await res.text();
    console.log('[claude.js] Anthropic status:', res.status);
    if (!res.ok) {
      console.error('[claude.js] Anthropic fout:', responseText.substring(0, 500));
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Anthropic API fout', detail: responseText.substring(0, 500) })
      };
    }

    const data = JSON.parse(responseText);

    // Supabase opslaan
    let supabaseError = null;
    if (body.saveToSupabase) {
      const evaluatieTekst = data.content?.map(b => b.text || '').join('') || '';

      const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/evaluaties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          datum:           body.meta.datum          || null,
          locatie:         body.meta.locatie         || null,
          manager:         body.meta.manager         || null,
          opentijd:        body.meta.opentijd        || null,
          sluittijd:       body.meta.sluittijd       || null,
          memo_verloop:    body.meta.memo_verloop    || null,
          memo_algemeen:   body.meta.memo_algemeen   || null,
          memo_personeel:  body.meta.memo_personeel  || null,
          memo_dj:         body.meta.memo_dj         || null,
          memo_lichten:    body.meta.memo_lichten    || null,
          memo_veiligheid: body.meta.memo_veiligheid || null,
          memo_td:         body.meta.memo_td         || null,
          memo_overig:     body.meta.memo_overig     || null,
          evaluatie_tekst: evaluatieTekst
        })
      });

      if (!supabaseRes.ok) {
        const errText = await supabaseRes.text();
        supabaseError = `Supabase ${supabaseRes.status}: ${errText}`;
        console.error('[claude.js] Supabase insert mislukt:', supabaseError);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, supabaseError })
    };

  } catch (err) {
    console.error('[claude.js] Handler fout:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
