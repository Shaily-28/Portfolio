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

  console.log("Nav built successfully ✅");
} catch (err) {
  console.error("Nav build failed ❌", err);
}
