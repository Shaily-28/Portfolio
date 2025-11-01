import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

const svg = d3.select('#projects-pie-plot');

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

const arc = arcGenerator({ startAngle: 0, endAngle: 2 * Math.PI });

svg.append('path').attr('d', arc).attr('fill', 'red');
