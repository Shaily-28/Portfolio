import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";
window.d3 = d3;

let ALL_PROJECTS = [];
let FILTERED = [];

function toYearCounts(list) {
  return Array.from(
    d3.rollup(list, v => v.length, d => String(d.year)),
    ([label, value]) => ({ label, value })
  ).sort((a, b) => d3.ascending(+a.label, +b.label));
}

function debounce(fn, delay = 150) {
  let t; 
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function setTitleCount(n) {
  const el = document.querySelector('.projects-title');
  if (el) el.textContent = `Projects (${n})`;
}

const tip = (() => {
  const el = document.getElementById('tooltip');
  const show = (html, evt) => {
    el.innerHTML = html;
    el.hidden = false;
    const { clientX: x, clientY: y } = evt;
    el.style.left = `${x + 12}px`;
    el.style.top  = `${y + 12}px`;
  };
  const hide = () => { el.hidden = true; };
  return { show, hide };
})();

const state = { active: null };

function setActiveYear(year) {
  state.active = year;


  d3.selectAll('.slice')
    .classed('is-active', d => d.data.label === year)
    .classed('is-dim',   d => d.data.label !== year);

  d3.selectAll('.bar')
    .classed('is-active', d => d.label === year)
    .classed('is-dim',    d => d.label !== year);

  d3.select('.legend').selectAll('li')
    .classed('is-active', d => d.label === year)
    .classed('is-dim',    d => d.label !== year);
}

function clearActive() {
  state.active = null;
  d3.selectAll('.slice,.bar,.legend li')
    .classed('is-active', false)
    .classed('is-dim', false);
}

async function initProjectsPage() {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  if (!projectsContainer) return;

  ALL_PROJECTS = projects.slice();
  FILTERED = projects.slice();

  updateAll();

  const input = document.getElementById('project-search');
  if (input) {
    input.addEventListener('input', debounce(ev => {
      const q = ev.target.value.trim().toLowerCase();
      FILTERED = ALL_PROJECTS.filter(p => {
        const hay = `${p.title} ${p.description} ${p.year}`.toLowerCase();
        return hay.includes(q);
      });
      updateAll();
    }, 150));
  }

  function updateAll() {

    const byYear = toYearCounts(FILTERED);
    drawProjectsPie(byYear);
    drawYearBarChart(byYear);

    renderProjects(FILTERED, projectsContainer, 'h2');

    setTitleCount(FILTERED.length);
  }
}


function drawProjectsPie(data) {
  const svgEl = document.getElementById('projects-pie-plot');
  if (!svgEl) return;

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const radius = 60;
  const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius); // donut
  const pie = d3.pie().value(d => d.value);
  const total = d3.sum(data, d => d.value);
  const color = d3.scaleOrdinal(d3.schemeTableau10)
  .domain(data.map(d => d.label)); 


  const slices = pie(data);

svg.selectAll('path')
  .data(slices)
  .join('path')
  .attr('class', 'slice')
  .attr('d', arc)
  .attr('fill', d => color(d.data.label))
  .append('title')
  .text(d => `${d.data.label}: ${d.data.value} projects`)
  .on('mouseenter', (ev, d) => {
    const pct = Math.round((d.data.value / total) * 100);
    tip.show(`<strong>${d.data.label}</strong><br>${d.data.value} projects • ${pct}%`, ev);
    setActiveYear(d.data.label);
  })
  .on('mousemove', (ev, d) => {
    const pct = Math.round((d.data.value / total) * 100);
    tip.show(`<strong>${d.data.label}</strong><br>${d.data.value} projects • ${pct}%`, ev);
  })
  .on('mouseleave', () => { tip.hide(); clearActive(); })
  .on('click', (ev, d) => setActiveYear(d.data.label));
  
svg.append('text')
  .attr('text-anchor', 'middle')
  .attr('dy', '0.35em')
  .style('font-weight', 700)
  .style('font-size', '12px')
  .text(d3.sum(data, d => d.value));

  d3.select('.legend')
  .selectAll('li')
  .data(data, d => d.label)
  .join('li')
  .attr('tabindex', 0)
  .html(d => `<span class="swatch" style="background:${color(d.label)}"></span>${d.label} <em>(${d.value})</em>`)
  .on('mouseenter', (ev, d) => setActiveYear(d.label))
  .on('mouseleave', clearActive)
  .on('focus',      (ev, d) => setActiveYear(d.label))
  .on('blur',       clearActive)
  .on('click',      (ev, d) => setActiveYear(d.label));

}

function drawYearBarChart(data) {
  data = [...data].sort((a, b) => d3.descending(a.value, b.value));
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

  g.append('text')
  .attr('transform', `rotate(-90) translate(${-innerH/2},${-margin.left + 14})`)
  .attr('text-anchor', 'middle')
  .style('font-size', '12px')
  .text('Projects');

const bars = g.selectAll('rect')
  .data(data, d => d.label)
  .join(
  
    enter => enter.append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('y', innerH)                  
      .attr('width', x.bandwidth())
      .attr('height', 0)                  
      .attr('fill', d => color(d.label))
      .call(enter => enter.transition().duration(600)
        .attr('y', d => y(d.value))
        .attr('height', d => innerH - y(d.value))
      ),

    update => update.call(update => update.transition().duration(600)
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => innerH - y(d.value))
      .attr('fill', d => color(d.label))
    ),

    exit => exit.call(exit => exit.transition().duration(200)
      .attr('y', innerH)
      .attr('height', 0)
    ).remove()
  );

bars
  .attr('tabindex', 0)
  .on('mouseenter', (ev, d) => { tip.show(`<strong>${d.label}</strong><br>${d.value} projects`, ev); setActiveYear(d.label); })
  .on('mousemove', (ev, d) => { tip.show(`<strong>${d.label}</strong><br>${d.value} projects`, ev); })
  .on('mouseleave', () => { tip.hide(); clearActive(); })
  .on('click',    (ev, d) => setActiveYear(d.label));

bars.select('title').remove();
bars.append('title')
  .text(d => `${d.label}: ${d.value} projects`);

g.selectAll('.bar')                       
  .on('mouseenter', (ev, d) => setActiveYear(d.label))
  .on('mouseleave', clearActive)
  .on('focus',      (ev, d) => setActiveYear(d.label))
  .on('blur',       clearActive)
  .on('click',      (ev, d) => setActiveYear(d.label));

}

initProjectsPage();