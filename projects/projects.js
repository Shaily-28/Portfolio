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

  
  drawProjectsPie(projects);
}

function drawProjectsPie(projects) {
  const svg = d3.select('#projects-pie-plot');
  if (svg.empty()) return;

  
  svg.selectAll('*').remove();

  const radius = 50;
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const pie = d3.pie().value(d => d[1]);
  const color = d3.scaleOrdinal(d3.schemeTableau10);


  const yearCounts = Array.from(
    d3.rollup(projects, v => v.length, d => String(d.year))
  );

  const slices = pie(yearCounts);

  svg.selectAll('path')
    .data(slices)
    .join('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i))
    .append('title')
    .text(d => `${d.data[0]}: ${d.data[1]} projects`);

  const total = d3.sum(slices, d => d.data[1]);

svg.selectAll('text')
  .data(slices)
  .join('text')
  .attr('transform', d => `translate(${arc.centroid(d)})`)
  .attr('text-anchor', 'middle')
  .attr('dy', '0.35em')
  .style('font-size', '10px')
  .text(d => {
    const year = d.data[0];
    const n = d.data[1];
    const pct = Math.round((n / total) * 100);
    return `${year}\n${pct}% (${n})`;
  });

initProjectsPage();}