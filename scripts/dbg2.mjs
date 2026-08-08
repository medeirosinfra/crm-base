import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
page.on("console", (m) => {
  const t = String(m.text());
  if (t.includes("getPaciente") || t.includes("paciente") || t.includes("error") || t.includes("TypeError")) {
    console.log("[BROWSE] " + t.slice(0, 300));
  }
});
page.on("pageerror", (e) => console.log("[PAGEERR] " + e.message.slice(0, 300)));

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
await new Promise(r => setTimeout(r, 7000));
console.log("H1 FINAL:", await page.evaluate(() => document.querySelector("h1")?.innerText));
console.log("BODY TEM Poliana:", await page.evaluate(() => document.body.innerText.includes("Poliana")));
await browser.close();