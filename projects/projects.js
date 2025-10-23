import { fetchJSON, renderProjects } from '../global.js';

async function initProjectsPage() {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  if (!projectsContainer) {
    console.warn('Missing .projects container on Projects page.');
    return;
  }

  renderProjects(projects, projectsContainer, 'h2');

  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    titleEl.textContent = `${titleEl.textContent.replace(/\s*\(\d+\)\s*$/, '')} (${projects.length})`;
  }
}

initProjectsPage();