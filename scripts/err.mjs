import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("[PAGEERROR] " + e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("[CLOG] " + m.text()); });

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
await new Promise(r => setTimeout(r, 6000));
console.log("URL:", await page.evaluate(() => location.pathname + location.search));
console.log("BODY:", (await page.evaluate(() => document.body.innerText)).slice(0, 200).replace(/\n/g, " "));
console.log("\nERROS COMPLETOS:\n" + (errs.slice(-8).join("\n\n") || "nenhum"));
await browser.close();