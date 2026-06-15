exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { id, evaluatie_tekst, status = 'concept', meta = {} } = body;

    const record = {
      datum:           meta.datum          || null,
      locatie:         meta.locatie         || null,
      manager:         meta.manager         || null,
      auteur_id:       meta.auteur_id       || null,
      opentijd:        meta.opentijd        || null,
      sluittijd:       meta.sluittijd       || null,
      onderwerp:       meta.onderwerp       || null,
      memo_verloop:    meta.memo_verloop    || null,
      memo_algemeen:   meta.memo_algemeen   || null,
      memo_personeel:  meta.memo_personeel  || null,
      memo_dj:         meta.memo_dj         || null,
      memo_lichten:    meta.memo_lichten    || null,
      memo_veiligheid: meta.memo_veiligheid || null,
      memo_td:         meta.memo_td         || null,
      memo_overig:     meta.memo_overig     || null,
      status
    };

    // Alleen evaluatie_tekst toevoegen als die er is
    if (evaluatie_tekst) record.evaluatie_tekst = evaluatie_tekst;

    let supabaseRes;

    if (id) {
      // PATCH: update bestaande rij
      supabaseRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/evaluaties?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(record)
        }
      );
    } else {
      // POST: nieuwe rij
      supabaseRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/evaluaties`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(record)
        }
      );
    }

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error('[opslaan.js] Supabase fout:', supabaseRes.status, errText);
      return { statusCode: supabaseRes.status, body: JSON.stringify({ error: errText }) };
    }

    const inserted = await supabaseRes.json();
    const newId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: newId || id })
    };

  } catch (err) {
    console.error('[opslaan.js] fout:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
