import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
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
await page.evaluate(() => { document.querySelector("a[href^='/pacientes/']")?.click(); });
await new Promise(r => setTimeout(r, 6000));
const res = await page.evaluate(() => {
  const html = document.documentElement.innerHTML;
  const find = (s) => html.includes(s);
  const el = [...document.querySelectorAll("h1,h2,h3")].map(h => h.innerText).slice(0, 8);
  return {
    url: location.pathname + location.search,
    voltar: find("Voltar para pacientes"),
    visao: find("Visão geral"),
    dados: find("Dados cadastrais"),
    naoEcontrado: find("não encontrado") || find("nao encontrado"),
    ficha: find("Ficha & Avaliação"),
    hTags: el,
  };
});
console.log(JSON.stringify(res, null, 2));
await browser.close();