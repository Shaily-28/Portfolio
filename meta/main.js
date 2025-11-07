
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
let commitsGlobal = [];

async function loadData() {
  const data = await d3.csv('./loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;
      const obj = {
        id: commit,
        url: 'https://github.com/YOUR_USER/YOUR_REPO/commit/' + commit,
        author, date, time, timezone, datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      Object.defineProperty(obj, 'lines', { value: lines, enumerable: false });
      return obj;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.group(data, d => d.file).size);

  const longestFileEntry = d3.greatest(
    d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
    d => d[1]
  );
  dl.append('dt').text('Longest file (lines)');
  dl.append('dd').text(longestFileEntry ? longestFileEntry[1] : 0);

  const avgFileLength = d3.mean(
    d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
    d => d[1]
  );
  dl.append('dt').text('Average file length');
  dl.append('dd').text(Math.round(avgFileLength ?? 0));

  const maxDepth = d3.max(data, d => d.depth);
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(maxDepth ?? 0);
}

 function showTooltip(commit, evt){
  const tip  = document.getElementById('commit-tooltip');
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  link.textContent = commit?.id ?? '(unknown)';
  link.href = commit?.url ?? '#';
  date.textContent = commit?.datetime
    ? commit.datetime.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })
    : '';

  const offset = 14;
  tip.style.left = (evt.clientX + offset) + 'px';
  tip.style.top  = (evt.clientY + offset) + 'px';
  tip.hidden = false;
}
function moveTooltip(evt){
  const tip = document.getElementById('commit-tooltip');
  const offset = 14;
  tip.style.left = (evt.clientX + offset) + 'px';
  tip.style.top  = (evt.clientY + offset) + 'px';
}
function hideTooltip(){
  document.getElementById('commit-tooltip').hidden = true;
}
function renderScatterPlot(data, commits) {
  const width = 600;
  const height = 350;
  const margin = { top: 10, right: 10, bottom: 40, left: 50 };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usable.width));

  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g').attr('transform', `translate(0,${usable.bottom})`).call(xAxis);
  svg.append('g').attr('transform', `translate(${usable.left},0)`).call(yAxis);


  const brush = d3.brush().on('start brush end', brushed);
  svg.call(brush); 


  const r = 3, jitterHours = 0.35, jitterMinutes = 18;

  svg.append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', d => {
      const ms = (Math.random() - 0.5) * jitterMinutes * 60 * 1000;
      return xScale(new Date(d.datetime.getTime() + ms));
    })
    .attr('cy', d => yScale(d.hourFrac + (Math.random() - 0.5) * jitterHours))
    .attr('r', r)
    .attr('fill', 'steelblue')
    .attr('fill-opacity', 0.7)
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.75)
    .style('cursor', 'pointer')
    .on('mouseenter', (event, commit) => { showTooltip(commit, event); })
    .on('mousemove',  (event) => { moveTooltip(event); })
    .on('mouseleave', () => { hideTooltip(); });

 
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection; 

  
  d3.selectAll('circle').classed('selected', d => isCommitSelected(selection, d));


  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;

  const px = xScale(commit.datetime);
  const py = yScale(commit.hourFrac);

  return x0 <= px && px <= x1 && y0 <= py && py <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection
    ? commitsGlobal.filter(d => isCommitSelected(selection, d))
    : [];
  const el = document.getElementById('selection-count');
  el.textContent = `${selected.length || 'No'} commits selected`;
}

function renderLanguageBreakdown(selection) {
  const selected = selection
    ? commitsGlobal.filter(d => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');
  if (!container) return;
  if (!selected.length) { container.innerHTML = ''; return; }

  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
  }
}

(async function init() {
  const data = await loadData();
  const commits = processCommits(data);
  commitsGlobal = commits;

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
})();




