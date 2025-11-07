
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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
    .groups(data, (d) => d.commit) 
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

(async function init() {
  const data = await loadData();
  const commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits); 
})();
