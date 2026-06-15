// netlify/functions/mail.js
// Verstuurt evaluatie via e-mail met Resend (https://resend.com - gratis tot 3000 mails/maand)
// Voeg RESEND_API_KEY toe als Netlify environment variable

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { evaluatie_id, evaluatie_tekst, onderwerp, locatie, datum, extra_emails } = JSON.parse(event.body);

    // Haal vaste emails op voor deze locatie uit Supabase
    const locRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/locaties?naam=eq.${encodeURIComponent(locatie)}&select=email_adressen`,
      { headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
    );
    const locData = await locRes.json();
    const vasteEmails = locData?.[0]?.email_adressen || [];

    // Combineer vaste + extra emails, verwijder duplicaten
    const alleEmails = [...new Set([...vasteEmails, ...(extra_emails || [])])].filter(Boolean);

    if (alleEmails.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geen e-mailadressen gevonden voor deze locatie.' }) };
    }

    // Stuur via Resend
    const mailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Avondevaluatie <noreply@jouwdomein.nl>', // pas aan naar jouw domein
        to: alleEmails,
        subject: onderwerp || `Avondevaluatie ${locatie} ${datum}`,
        text: evaluatie_tekst,
        html: `<pre style="font-family:sans-serif;white-space:pre-wrap;line-height:1.8;">${evaluatie_tekst.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`
      })
    });

    if (!mailRes.ok) {
      const err = await mailRes.text();
      console.error('[mail.js] Resend fout:', err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Mail versturen mislukt: ' + err }) };
    }

    // Log in Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/mail_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ evaluatie_id, verzonden_naar: alleEmails, status: 'verzonden' })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, verzonden_naar: alleEmails })
    };

  } catch (err) {
    console.error('[mail.js] Fout:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
