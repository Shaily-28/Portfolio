console.log("✅ projects.js loaded");

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

window.d3 = d3;

console.log("✅ D3 version:", d3.version);

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

const byYear = Array.from(
  d3.rollup(projects, v => v.length, d => String(d.year)),
  ([label, value]) => ({ label, value })
).sort((a, b) => d3.ascending(+a.label, +b.label));

console.log('byYear:', byYear);

drawProjectsPie(byYear);
drawYearBarChart(byYear);


function drawProjectsPie(data) {
  const svgEl = document.getElementById('projects-pie-plot');
  if (!svgEl) return;

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const radius = 60;
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const pie = d3.pie().value(d => d.value);
  const color = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.label));


  const slices = pie(data);
  const total = d3.sum(data, d => d.value);

  svg.selectAll('path')
    .data(slices)
    .join('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.label))
    .append('title')
    .text(d => `${d.data.label}: ${d.data.value} projects`);

  svg.selectAll('text')
    .data(slices)
    .join('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-size', '9px')
    .each(function(d) {
      const pct = Math.round((d.data.value / total) * 100);
      const t = d3.select(this);
      t.append('tspan')
        .attr('x', 0)
        .text(d.data.label);
      t.append('tspan')
        .attr('x', 0)
        .attr('dy', '1em')
        .text(`${pct}% (${d.data.value})`);
    });

  d3.select('.legend')
    .selectAll('li')
    .data(data)
    .join('li')
    .style('--color', d => color(d.label))
    .html(d => `<span class="swatch" style="background: var(--color)"></span>${d.label} <em>(${d.value})</em>`);
}

function drawYearBarChart(data) {
  const svg = d3.select('#projects-bar-plot');
  if (svg.empty()) return;
  svg.selectAll('*').remove();

  const width = 520, height = 280;
  const margin = { top: 10, right: 12, bottom: 40, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(data.map(d => d.label))     
    .range([0, innerW])
    .padding(0.15);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)]).nice()
    .range([innerH, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(data.map(d => d.label));

  const g = svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x))
    .selectAll('text').style('font-size', '10px');

  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')))
    .selectAll('text').style('font-size', '10px');

  g.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.label))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => innerH - y(d.value))
    .attr('fill', d => color(d.label))
    .append('title')
    .text(d => `${d.label}: ${d.value} project${d.value === 1 ? '' : 's'}`);

  g.selectAll('text.bar-label')
    .data(data)
    .join('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.label) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 6)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('display', d => (innerH - y(d.value) < 14 ? 'none' : null))
    .text(d => d.value);
}

initProjectsPage();}