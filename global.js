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
const form = document.querySelector("#contact-form");

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validate native constraints first
  if (!form.reportValidity()) return;

  const data = new FormData(form);

  const to = form.action.replace(/^mailto:/i, "").trim();
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("replyto") || "").toString().trim();
  const subject = (data.get("subject") || `Message from ${name || "your website"}`).toString();
  const message = (data.get("message") || "").toString();

  const bodyLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message,
  ];

  const params = new URLSearchParams({
    subject,
    body: bodyLines.join("\n"),
  });

  const url = `mailto:${to}?${params.toString()}`;

  location.href = url;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return []; 
  }
} 

function renderProjects(projectsArray, containerElement, tag = 'h2') {
  containerElement.innerHTML = '';

  if (!Array.isArray(projectsArray) || projectsArray.length === 0) {
    containerElement.innerHTML = `<p class="empty">No projects to display yet.</p>`;
    return;
  }

 
  const safeTag = (tag === 'h2' || tag === 'h3') ? tag : 'h2';

  const frag = document.createDocumentFragment();

  projectsArray.forEach((project = {}) => {
    const {
      title = 'Untitled Project',
      image = '',
      description = '',   
      year = ''
    } = project;

    const article = document.createElement('article');
    article.innerHTML = `
      <${safeTag}>${title}</${safeTag}>
      ${image ? '<img src="' + image + '" alt="' + title + '">' : ''}

      <div class="project-meta">
        <p class="project-desc">${description}</p>
        ${year !== '' ? `<time class="project-year" datetime="${year}">${year}</time>` : ''}
      </div>
    `;
    frag.appendChild(article);
  });

  containerElement.appendChild(frag);
}

export async function fetchGitHubData(username) {
  if (!username) return {};
  // Reuse fetchJSON as the lab suggests
  return await fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}

