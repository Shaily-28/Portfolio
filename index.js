import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function initHome() {
  
  const allProjects = await fetchJSON('./lib/projects.json');
  const latestProjects = allProjects.slice(0, 3); 

  const homeProjectsContainer = document.querySelector('.projects');
  if (homeProjectsContainer) {
    renderProjects(latestProjects, homeProjectsContainer, 'h2');
  }

  const profileStats = document.querySelector('#profile-stats');
  if (profileStats) {
    
    const githubData = await fetchGitHubData('Shaily-28');
    if (githubData && Object.keys(githubData).length) {
      profileStats.innerHTML = `
        <h2>GitHub Profile</h2>
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    }
  }
}

initHome();