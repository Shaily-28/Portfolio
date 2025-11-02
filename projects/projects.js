console.log('✅ projects.js loaded');
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
  drawYearBarChart(projects);
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
  .style('font-size', '8px')
  .style('line-hieght', '1em')
  .text(d => {
    const year = d.data[0];
    const n = d.data[1];
    const pct = Math.round((n / total) * 100);
    return `${year}\n${pct}% (${n})`;
  });
} 


function drawYearBarChart(projects) {
  const svg = d3.select('#projects-bar-plot');
  if (svg.empty()) return;
  svg.selectAll('*').remove();

  const counts = Array.from(
    d3.rollup(projects, v => v.length, d => String(d.year))
  )
  .map(([year, n]) => ({ year, n }))
  .sort((a, b) => d3.ascending(+a.year, +b.year)); 

  const width = 520, height = 280;
  const margin = { top: 10, right: 12, bottom: 40, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(counts.map(d => d.year))
    .range([0, innerW])
    .padding(0.15);

  const y = d3.scaleLinear()
    .domain([0, d3.max(counts, d => d.n)]).nice()
    .range([innerH, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(counts.map(d => d.year));

  const g = svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '10px');

  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')))
    .selectAll('text')
    .style('font-size', '10px');

  g.selectAll('rect')
    .data(counts)
    .join('rect')
    .attr('x', d => x(d.year))
    .attr('y', d => y(d.n))
    .attr('width', x.bandwidth())
    .attr('height', d => innerH - y(d.n))
    .attr('fill', d => color(d.year))
    .append('title')
    .text(d => `${d.year}: ${d.n} project${d.n === 1 ? '' : 's'}`);

  g.selectAll('text.bar-label')
    .data(counts)
    .join('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.year) + x.bandwidth() / 2)
    .attr('y', d => y(d.n) - 6)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .text(d => d.n);
}

initProjectsPage(); 