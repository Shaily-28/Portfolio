console.log("IT'S ALIVE!")
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
} 
const navLinks = Array.from(document.querySelectorAll("nav a"));
const current = navLinks.find(a => a.host === location.host && a.pathname === location.pathname);
current?.classList.add("current");
