exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { evaluatie_tekst, meta = {} } = body;

    if (!evaluatie_tekst) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geen evaluatietekst meegegeven' }) };
    }

    const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/evaluaties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        datum:           meta.datum          || null,
        locatie:         meta.locatie         || null,
        manager:         meta.manager         || null,
        opentijd:        meta.opentijd        || null,
        sluittijd:       meta.sluittijd       || null,
        memo_verloop:    meta.memo_verloop    || null,
        memo_algemeen:   meta.memo_algemeen   || null,
        memo_personeel:  meta.memo_personeel  || null,
        memo_dj:         meta.memo_dj         || null,
        memo_lichten:    meta.memo_lichten    || null,
        memo_veiligheid: meta.memo_veiligheid || null,
        memo_td:         meta.memo_td         || null,
        memo_overig:     meta.memo_overig     || null,
        evaluatie_tekst
      })
    });

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error('[opslaan.js] Supabase fout:', supabaseRes.status, errText);
      return {
        statusCode: supabaseRes.status,
        body: JSON.stringify({ error: errText })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error('[opslaan.js] Handler fout:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
