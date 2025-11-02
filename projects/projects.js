import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";
window.d3 = d3;

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
  try {
    console.time("initProjectsPage");

    const projects = await fetchJSON("../lib/projects.json");
    console.log("projects.json loaded:", { length: projects?.length, projects });

    const projectsContainer = document.querySelector(".projects");
    if (!projectsContainer) {
      console.warn("Missing .projects container on Projects page.");
      return;
    }
    renderProjects(projects, projectsContainer, "h2");

const titleEl = document.querySelector(".projects-title");
    if (titleEl) {
      titleEl.textContent = `${titleEl.textContent.replace(/\s*\(\d+\)\s*$/, "")} (${projects.length})`;
    }

if (!Array.isArray(projects) || projects.length === 0) {
      console.warn("⚠️ No projects found (fetch likely failed). Charts will not draw.");
      document.querySelector(".projects")?.insertAdjacentHTML(
        "afterbegin",
        `<p class="empty">No projects to display yet (couldn't load projects.json).</p>`
      );
      return;
    }
    const byYear = Array.from(
      d3.rollup(projects, v => v.length, d => String(d.year)),
      ([label, value]) => ({ label, value })
    ).sort((a, b) => d3.ascending(+a.label, +b.label));

    console.log("byYear:", byYear);

    console.log("draw pie len:", byYear.length);
    drawProjectsPie(byYear);

    console.log("draw bar len:", byYear.length);
    drawYearBarChart(byYear);

  } catch (err) {
    console.error("initProjectsPage crashed:", err);
  } finally {
    console.timeEnd("initProjectsPage");
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
  .data(data, d => d.label)
  .join('rect')
  .attr('class', 'bar')
  .attr('x', d => x(d.label))
  .attr('y', d => y(d.value))
  .attr('width', x.bandwidth())
  .attr('height', d => innerH - y(d.value))
  .attr('fill', d => color(d.label))
  .on('mouseenter', (ev, d) => { tip.show(`<strong>${d.label}</strong><br>${d.value} projects`, ev); setActiveYear(d.label); })
  .on('mousemove', (ev, d) => tip.show(`<strong>${d.label}</strong><br>${d.value} projects`, ev))
  .on('mouseleave', () => { tip.hide(); clearActive(); })
  .on('click', (ev, d) => setActiveYear(d.label));

g.selectAll('.bar')                       
  .on('mouseenter', (ev, d) => setActiveYear(d.label))
  .on('mouseleave', clearActive)
  .on('focus',      (ev, d) => setActiveYear(d.label))
  .on('blur',       clearActive)
  .on('click',      (ev, d) => setActiveYear(d.label));

}

initProjectsPage();