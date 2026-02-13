// app.js
function qs(id) { return document.getElementById(id); }

async function api(action, payload = {}) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });

  const data = await res.json();
  if (!data) throw new Error("No response");

  if (data.success === false) {
    throw new Error(data.msg || "Gagal memproses permintaan");
  }
  return data;
}

function setAdminToken(token) {
  localStorage.setItem("EARSIP_ADMIN_TOKEN", token);
}

function getAdminToken() {
  return localStorage.getItem("EARSIP_ADMIN_TOKEN") || "";
}

function clearAdminToken() {
  localStorage.removeItem("EARSIP_ADMIN_TOKEN");
}

function requireAdmin() {
  const t = getAdminToken();
  if (!t) window.location.href = "./login.html";
}
