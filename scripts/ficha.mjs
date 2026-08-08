import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("[PAGEERR] " + e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errs.push("[CLOG] " + m.text().slice(0, 200)); });

await page.goto("https://draluana.medeirossolucoestech.com.br/login", { waitUntil: "networkidle2" });
await page.evaluate(() => {
  const a = [...document.querySelectorAll("input")];
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  const t = (e, v) => { set.call(e, v); e.dispatchEvent(new Event("input", { bubbles: true })); };
  const u = a.find(i => i.type === "email" || i.name === "email" || /email/i.test(i.placeholder || ""));
  const p = a.find(i => i.type === "password");
  if (u && p) { t(u, "luana@clinicaodonto.com.br"); t(p, "Medeiros2026!"); }
});
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /entrar|login/i.test(x.textContent)); if (b) b.click(); });
await new Promise(r => setTimeout(r, 4000));
await page.goto("https://draluana.medeirossolucoestech.com.br/pacientes/56c7d457-50ab-4493-9154-0da4d50ba733", { waitUntil: "networkidle2" });
await new Promise(r => setTimeout(r, 5000));
// Clica em "Ficha & Avaliação"
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button, a")].find(x => /Ficha & Avaliação/.test(x.textContent || ""));
  if (b) { b.click(); return b.textContent.trim(); }
  return null;
});
console.log("BOTÃO FICHA CLICADO:", clicked);
await new Promise(r => setTimeout(r, 5000));
const body = await page.evaluate(() => document.body.innerText);
console.log("TEM 'Anamnese & Avaliação Facial':", body.includes("Anamnese & Avaliação Facial"));
console.log("TEM 'Procedimentos Alinhados':", body.includes("Procedimentos Alinhados"));
console.log("TEM 'Odontograma'/'Modelo de Dentes':", body.includes("Odontograma") || body.includes("Modelo de Dentes"));
console.log("TEM 'Salvar Anamnese':", body.includes("Salvar Anamnese"));
console.log("TEM 'Histórico de saúde':", body.includes("Histórico de saúde"));
console.log("ERROS:", errs.length ? errs.join("\n") : "nenhum");
console.log("SNIP:", body.slice(0, 800).replace(/\n/g, " "));
await browser.close();