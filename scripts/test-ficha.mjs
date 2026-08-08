import puppeteer from "puppeteer-core";

const CHROME = "/home/medeirosinfra/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = "https://draluana.medeirossolucoestech.com.br";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1400,1000"],
  defaultViewport: { width: 1400, height: 1000 },
});

const page = await browser.newPage();
const logs = [];
page.on("console", (m) => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

// 1. Login
await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector("input[type=email], input[type=text], input", { timeout: 15000 }).catch(()=>{});
const inputs = await page.$$("input");
console.log("inputs encontrados:", inputs.length);
await page.evaluate(() => {
  const usr = document.querySelector('input[type=email], input[placeholder*="ail"], input[name=email]');
  const pwd = document.querySelector('input[type=password]');
  if (!usr && document.querySelectorAll('input').length >= 2) {
    const all = document.querySelectorAll('input');
    // grade por position do usuário email
    // Supabase/own login: primeiro = email, segundo = senha
  }
  return { usr: !!usr, pwd: !!pwd, total: document.querySelectorAll('input').length };
}).then((r) => console.log("campos:", JSON.stringify(r)));

// Preenche email/senha
const filled = await page.evaluate(() => {
  const all = document.querySelectorAll('input');
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  const type = (el, v) => { set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  let u = [...all].find(i => i.type === 'email' || i.name === 'email' || /email|e-?mail/i.test(i.placeholder || ''));
  let p = [...all].find(i => i.type === 'password');
  if (!u && all.length === 2) { u = all[0]; p = all[1]; }
  if (!p && all.length === 2) { p = all[1]; }
  if (u) type(u, 'luana@clinicaodonto.com.br');
  if (p) type(p, 'Medeiros2026!');
  return { u: u?.type || u?.name || null, p: p?.type || null };
});
console.log("email/senha preenchidos:", JSON.stringify(filled));

// Clicka entrar
const clicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const b = btns.find(x => /entrar|login|acessar/i.test(x.textContent));
  if (b) { b.click(); return b.textContent.trim(); }
  return null;
});
console.log("botao clique:", clicked);
await page.waitForTimeout(5000);
console.log("pathname:", page.url());

// 2. Ir para pacientes
await page.goto(`${BASE}/pacientes`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForTimeout(4000);
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 600));
console.log("BODY PACIENTES:\n", bodyText);

// 3. Clicar no primeiro card
const firstHref = await page.evaluate(() => document.querySelector("a[href*='/pacientes/']")?.getAttribute('href') || null);
console.log("primeiro card href:", firstHref);
if (firstHref) {
  await page.goto(`${BASE}${firstHref}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForTimeout(5000);
  const detBody = await page.evaluate(() => document.body.innerText.slice(0, 800));
  console.log("CORPO DA PÁGINA DE DETALHE:\n", detBody);
}

console.log("\nLOGS CONSOLE/PAGE:");
logs.forEach((l) => console.log(l));

await browser.close();