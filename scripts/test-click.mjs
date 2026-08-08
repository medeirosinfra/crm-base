import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1400,1000"],
});
const page = await browser.newPage();
page.on("console", (m) => {
  if (m.type() === 'error' || m.text().includes('React') || m.text().includes('Error')) {
    console.log(`[CONSOLE ERROR] ${m.text()}`);
  }
});
page.on("pageerror", (e) => console.log(`[PAGE ERROR] ${e.message}`));

await page.goto("https://draluana.medeirossolucoestech.com.br/login", { waitUntil: "networkidle2" });
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
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /entrar|login|acessar/i.test(x.textContent));
  if (b) { b.click(); return true; }
  return false;
});
console.log("Clicou login:", clicked);
await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(()=>{});

await page.goto("https://draluana.medeirossolucoestech.com.br/pacientes", { waitUntil: "networkidle2" });
console.log("URL atual:", page.url());

// Clica no primeiro card de paciente (a tag <a> agora)
const href = await page.evaluate(() => {
  const a = document.querySelector("a[href^='/pacientes/']");
  if (a) {
    const h = a.getAttribute("href");
    a.click();
    return h;
  }
  return null;
});
console.log("Clicou no card com href:", href);
await new Promise(r => setTimeout(r, 4000));
console.log("URL apos clique:", page.url());
console.log("H1 da pagina:", await page.evaluate(() => document.querySelector("h1")?.innerText || "sem h1"));
console.log("Texto visivel do corpo (1000 chars):", await page.evaluate(() => document.body.innerText.slice(0, 1000)));

await browser.close();