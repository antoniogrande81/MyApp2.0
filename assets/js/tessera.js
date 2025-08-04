import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://lycrgzptkdkksukcwrld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk'
);

console.log("tessera.js caricato");

const { data: { user }, error: userError } = await supabase.auth.getUser();

if (!user || userError) {
  alert("Utente non autenticato");
  window.location.href = "/login.html";
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("nome, cognome")
  .eq("id", user.id)
  .single();

if (profileError || !profile) {
  alert("Errore nel caricamento del profilo");
  console.error(profileError);
}

const { data: tessera, error: tesseraError } = await supabase
  .from("tessere")
  .select("numero_tessera")
  .eq("user_id", user.id)
  .single();

if (tesseraError || !tessera) {
  alert("Errore nel caricamento della tessera");
  console.error(tesseraError);
}

document.getElementById("nomeCompleto").textContent = `${profile.nome} ${profile.cognome}`;
document.getElementById("numeroTessera").textContent = `Tessera N° ${tessera.numero_tessera}`;

new QRCode(document.getElementById("qrcode"), {
  text: tessera.numero_tessera,
  width: 128,
  height: 128,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
});
