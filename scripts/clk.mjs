import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("[PAGEERR] " + e.message.slice(0, 300)));
page.on("console", (m) => { if (m.type() === "error") errs.push("[CLOG] " + m.text().slice(0, 300)); });
page.on("requestfailed", (r) => errs.push("[REQFAIL] " + r.url().slice(0, 150)));

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
await page.goto("https://draluana.medeirossolucoestech.com.br/pacientes", { waitUntil: "networkidle2" });
await new Promise(r => setTimeout(r, 3000));
const href = await page.evaluate(() => { const a = document.querySelector("a[href^='/pacientes/']"); if (a) { const h = a.getAttribute("href"); a.click(); return h; } return null; });
console.log("CARD CLICADO:", href);
await new Promise(r => setTimeout(r, 5000));
console.log("URL:", await page.evaluate(() => location.pathname + location.search));
console.log("H1:", await page.evaluate(() => document.querySelector("h1")?.innerText || "sem-h1"));
const body = await page.evaluate(() => document.body.innerText);
console.log("TEM POLIANA:", body.includes("Poliana de Jesus Domingos"));
console.log("TEM 'Telefone':", body.includes("Telefone") || body.includes("telefone"));
console.log("TEM 'Ficha':", body.includes("Ficha"));
console.log("TEM 'Visão geral':", body.includes("Visão geral"));
console.log("BODY SNIP:", body.slice(0, 500).replace(/\n/g, " "));
console.log("ERROS:\n" + (errs.join("\n") || "nenhum"));
await browser.close();