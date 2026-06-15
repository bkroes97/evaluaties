// auth-check.js — voeg toe aan elke pagina die auth vereist
// <script src="/auth-check.js"></script>

const SUPABASE_URL  = 'https://gobqaidvirtadgpduznd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvYnFhaWR2aXJ0YWRncGR1em5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI0OTgsImV4cCI6MjA5NjY2ODQ5OH0.1e3jxFsGKaylTJCIvqZEP-m-F_j1Az1L06et9DP2rYo';

window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

window._authData = null;

async function initAuth(vereistRollen) {
  const { data: { session } } = await window._supabase.auth.getSession();
  if (!session) { window.location.href = '/auth.html'; return null; }

  const { data: profiel } = await window._supabase
    .from('gebruikers')
    .select('*, gebruiker_locaties(locatie_id, is_hoofdlocatie)')
    .eq('id', session.user.id)
    .single();

  if (!profiel?.goedgekeurd) { window.location.href = '/auth.html'; return null; }
  if (vereistRollen && !vereistRollen.includes(profiel.rol)) {
    window.location.href = '/index.html'; return null;
  }

  window._authData = { user: session.user, profiel };
  return window._authData;
}

function magBewerken(evaluatie) {
  if (!window._authData) return false;
  const { profiel } = window._authData;
  const rol = profiel.rol;

  if (rol === 'admin' || rol === 'rayonmanager') return true;
  if (rol === 'kijker') return false;

  // Bedrijfsleider en shiftmanager: 24u regel
  const isEigenaar = evaluatie.auteur_id === profiel.id;
  if (!isEigenaar) return false;

  const vergrendeld = evaluatie.bewerk_vergrendeld_op;
  if (!vergrendeld) return true; // nog geen tijdslimiet ingesteld
  return new Date() < new Date(vergrendeld);
}

function magZien(evaluatie) {
  if (!window._authData) return false;
  const { profiel } = window._authData;
  const rol = profiel.rol;

  if (rol === 'admin' || rol === 'rayonmanager') return true;

  const locatieToegang = profiel.gebruiker_locaties || [];
  const heeftToegang = locatieToegang.some(t => t.locatie_id === evaluatie.locatie_id);
  const isEigenaar = evaluatie.auteur_id === profiel.id;

  if (rol === 'shiftmanager') return isEigenaar;
  if (rol === 'kijker') return heeftToegang;
  if (rol === 'bedrijfsleider') return isEigenaar || heeftToegang;

  return false;
}
