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

const data = [1, 2, 3, 4, 5, 5];

const slice = d3.pie();
const arcData = slice(data);

const arcs = arcData.map(d => arcGenerator(d));

const colors = d3.scaleOrdinal(d3.schemeTableau10);

arcs.forEach((pathD, i) => {
  svg.append('path')
     .attr('d', pathD)
     .attr('fill', colors[i]);
});

