import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";
window.d3 = d3;

function arcTween(arc) {
  return function(d) {
    const i = d3.interpolate(this._current || d, d);
    this._current = i(1);
    return t => arc(i(t));
  };
}

function arcTweenToZero(arc) {
  return function(d) {
    const zero = { ...d, startAngle: d.endAngle, endAngle: d.endAngle };
    const i = d3.interpolate(d, zero);
    return t => arc(i(t));
  };
}

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
  ALL_PROJECTS = projects;
  FILTERED = projects.slice();

  const projectsContainer = document.querySelector('.projects');
  const input = document.getElementById('project-search');
  const clearBtn = document.getElementById('project-search-clear');

  function updateAll() {
    const byYear = toYearCounts(FILTERED);
    drawProjectsPie(byYear);
    drawYearBarChart(byYear);
    renderProjects(FILTERED, projectsContainer, 'h2');  
    setTitleCount(FILTERED.length);
  }

  if (input) {
    input.addEventListener('input', debounce(ev => {
      const q = ev.target.value.trim().toLowerCase();
      FILTERED = q
        ? ALL_PROJECTS.filter(p =>
            `${p.title} ${p.description} ${p.year}`.toLowerCase().includes(q)
          )
        : ALL_PROJECTS.slice();
      updateAll();
    }, 150));
  }

  if (clearBtn && input) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      FILTERED = ALL_PROJECTS.slice();
      updateAll();
      input.focus();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        clearBtn.click();
        e.preventDefault();
      }
    });
  }

  if (input && input.value.trim()) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    updateAll();
  }
}


function drawProjectsPie(data) {
  const svgEl = document.getElementById('projects-pie-plot');
  if (!svgEl) return;

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const radius = 60;
  const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
  const pie = d3.pie().value(d => d.value);
  const total = d3.sum(data, d => d.value);
  const color = d3.scaleOrdinal(d3.schemeTableau10)
  .domain(data.map(d => d.label)); 


  const slices = pie(data);

const paths = svg.selectAll('path.slice')
  .data(slices, d => d.data.label); 

paths.exit()
  .transition().duration(400)
  .attrTween('d', arcTweenToZero(arc))
  .remove();

const pathsEnter = paths.enter()
  .append('path')
  .attr('class', 'slice')
  .attr('fill', d => color(d.data.label))
  .each(function(d) { this._current = d; })
  .transition().duration(600)
  .attrTween('d', arcTween(arc));

paths.transition().duration(600)
  .attrTween('d', arcTween(arc));

const allSlices = paths.merge(pathsEnter);

allSlices
  .on('mouseenter', (ev, d) => {
    const pct = Math.round((d.data.value / d3.sum(data, d => d.value)) * 100);
    tip.show(`<strong>${d.data.label}</strong><br>${d.data.value} projects • ${pct}%`, ev);
    setActiveYear(d.data.label);
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
  .on('focus',(ev, d) => setActiveYear(d.label))
  .on('blur',clearActive)
  .on('click',(ev, d) => setActiveYear(d.label));

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


const barsSel = g.selectAll('rect.bar')
  .data(data, d => d.label);
const barsEnter = barsSel.enter()
  .append('rect')
  .attr('class', 'bar')
  .attr('x', d => x(d.label))
  .attr('y', innerH)          
  .attr('width', x.bandwidth())
  .attr('height', 0)
  .attr('fill', d => color(d.label));

barsEnter.merge(barsSel)
  .transition()
  .duration(500)
  .attr('x', d => x(d.label))
  .attr('width', x.bandwidth())
  .attr('y', d => y(d.value))
  .attr('height', d => innerH - y(d.value));

barsSel.exit()
  .transition()
  .duration(300)
  .attr('height', 0)
  .attr('y', innerH)
  .remove();

g.selectAll('rect.bar').select('title').remove();
g.selectAll('rect.bar')
  .append('title')
  .text(d => `${d.label}: ${d.value}`);


  const labels = g.selectAll('text.bar-label')
    .data(data, d => d.label);

  labels.exit()
    .transition().duration(400)
    .attr('y', innerH - 6)
    .style('opacity', 0)
    .remove();

  const labelsEnter = labels.enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.label) + x.bandwidth() / 2)
    .attr('y', innerH - 6)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('opacity', 0)
    .text(d => d.value);

  labelsEnter.transition().duration(500)
    .attr('y', d => y(d.value) - 6)
    .style('opacity', 1);

  labels.merge(labelsEnter)
    .transition().duration(500)
    .attr('x', d => x(d.label) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 6)
    .style('opacity', d => (innerH - y(d.value) < 14 ? 0 : 1));
}


initProjectsPage();