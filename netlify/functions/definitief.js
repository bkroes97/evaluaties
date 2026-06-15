// netlify/functions/definitief.js
// Markeert een evaluatie als definitief en start de tweede 24u bewerkperiode

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { evaluatie_id, evaluatie_tekst, versie_nummer } = JSON.parse(event.body);
    if (!evaluatie_id) return { statusCode: 400, body: JSON.stringify({ error: 'Geen evaluatie_id' }) };

    const nu = new Date();
    const vergrendeldOp = new Date(nu.getTime() + 24 * 60 * 60 * 1000); // +24 uur

    // Sla nieuwe versie op
    if (evaluatie_tekst && versie_nummer) {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/evaluatie_versies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ evaluatie_id, versie_nummer, evaluatie_tekst })
      });
    }

    // Update evaluatie status
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/evaluaties?id=eq.${evaluatie_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'definitief',
          definitief_op: nu.toISOString(),
          bewerk_vergrendeld_op: vergrendeldOp.toISOString()
        })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: err }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, bewerk_vergrendeld_op: vergrendeldOp.toISOString() })
    };

  } catch (err) {
    console.error('[definitief.js] Fout:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
