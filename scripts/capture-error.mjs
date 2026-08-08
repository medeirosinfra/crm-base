import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto("https://draluana.medeirossolucoestech.com.br/login", { waitUntil: "networkidle2", timeout: 60000 });
await page.evaluate(() => {
  const all = document.querySelectorAll('input');
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  const type = (el, v) => { set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  let u = [...all].find(i => i.type === 'email' || i.name === 'email' || /email/i.test(i.placeholder || ''));
  let p = [...all].find(i => i.type === 'password');
  if (!u && all.length >= 2) { u = all[0]; p = all[1]; }
  if (u) type(u, 'luana@clinicaodonto.com.br');
  if (p) type(p, 'Medeiros2026!');
});
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /entrar|login|acessar/i.test(x.textContent));
  if (b) b.click();
});
await new Promise(r => setTimeout(r, 4000));

// Listen for errors specifically during hydrate after goto pacientes
await page.goto("https://draluana.medeirossolucoestech.com.br/pacientes", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));
errors.push("FINAL URL: " + page.url());
errors.push("HAS CARDS: " + (await page.evaluate(() => !!document.querySelector("a[href^='/pacientes/']"))));
errors.push("BODY SNIP: " + (await page.evaluate(() => document.body.innerText.slice(0,200))));

console.log(errors.join("\n"));
await browser.close();