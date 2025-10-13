console.log("IT'S ALIVE! (global.js loaded)");

export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

try {
 
  const isLocalHost = ["localhost", "127.0.0.1"].includes(location.hostname);
  const isFile = location.protocol === "file:";
  const BASE_PATH = isLocalHost || isFile
    ? "/"
    : `/${location.pathname.split("/")[1]}/`;

  const pages = [
    { url: "",           title: "Home" },
    { url: "projects/",  title: "Projects" },
    { url: "contact/",   title: "Contact" },
    { url: "resume/",    title: "Resume" },
    { url: "https://github.com/Shaily-28", title: "GitHub", external: true },
  ];

  document.querySelectorAll("body > nav").forEach(n => n.remove());

  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Primary");
  document.body.prepend(nav);

  for (const p of pages) {
    const a = document.createElement("a");
    a.href = p.external ? p.url : BASE_PATH + p.url;
    a.textContent = p.title;
    if (p.external) a.target = "_blank";

    const isCurrent =
      a.host === location.host &&
      a.pathname.replace(/\/+$/, "") === location.pathname.replace(/\/+$/, "");
    if (isCurrent) {
      a.classList.add("current");
      a.setAttribute("aria-current", "page");
    }
    nav.append(a);
  }
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
); 
  console.log("Nav built successfully ✅");
} catch (err) {
  console.error("Nav build failed ❌", err);
}
const select = document.querySelector("#theme-select");
function setColorScheme(value) {
 document.documentElement.style.setProperty("color-scheme", value);
  if (select) select.value = value;
}
const savedScheme = localStorage.getItem("color-scheme");
setColorScheme(savedScheme || "light dark"); 

select?.addEventListener("input", (e) => {
  const value = e.target.value;
  setColorScheme(value);
  localStorage.setItem("color-scheme", value);
});
