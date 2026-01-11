import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://gelhizmssqlexlxkvufc.supabase.co",
  "sb_publishable_AstKmfIU-pBBXXfPDlw9HA_hQYfLqcb"
);

const form = document.getElementById("txForm");
const msg = document.getElementById("msg");

// Proteção por sessão
const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) {
  window.location.href = "/finfamily/pages/login/login.html";
}

// Descobre a family_id do usuário
const { data: fam } = await supabase
  .from("family_members")
  .select("family_id")
  .single();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Salvando...";

  const payload = {
    family_id: fam.family_id,
    type: document.getElementById("type").value,
    title: document.getElementById("title").value,
    amount: parseFloat(document.getElementById("amount").value),
    date: document.getElementById("date").value,
  };

  const { error } = await supabase.from("transactions").insert(payload);

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Salvo com sucesso!";
  form.reset();
});
