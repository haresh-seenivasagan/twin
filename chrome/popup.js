// Twin API URL
const TWIN_API = 'https://twin.erniesg.workers.dev';

// Initialize on popup open
async function init() {
  console.log('Twin Extension: Initializing popup...');

  chrome.runtime.sendMessage({ type: 'GET_USER_STATE' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      const message = chrome.runtime.lastError?.message || 'No response from background script';
      console.error('GET_USER_STATE error:', chrome.runtime.lastError);
      showStatus(message, 'error');
      showLoginView();
      return;
    }

    if (response.userId) {
      console.log('Found Twin session, userId:', response.userId);
      if (response.persona) {
        displayPersona(response.persona);
        showPersonaView();
        
        // Check if persona is complete
        const hasInterests = response.persona.interests && response.persona.interests.length > 0;
        const hasGoals = response.persona.currentGoals && response.persona.currentGoals.length > 0;
        
        if (!hasInterests && !hasGoals) {
          showStatus('⚠️ Persona incomplete - visit dashboard to add interests & goals', 'warning');
        }
      } else {
        // We have a user but no persona
        console.warn('User logged in but no persona found');
        showStatus('❌ No persona found - please complete onboarding', 'error');
        showLoginView();
      }
    } else {
      console.log('No Twin session found');
      showLoginView();
    }
  });

  setupListeners();
}

function setupListeners() {
  document.getElementById('login-redirect-btn')?.addEventListener('click', redirectToLogin);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('refresh-btn')?.addEventListener('click', handleRefresh);
}

// Check if user is logged into Twin website
function redirectToLogin() {
  // Open Twin login page in new tab
  chrome.tabs.create({ url: `${TWIN_API}/login` });
  window.close();
}

function displayPersona(persona) {
  document.getElementById('persona-name').textContent = persona.name || 'User';
  document.getElementById('persona-profession').textContent = persona.profession || 'Not specified';

  const interests = persona.interests?.join(', ') || '⚠️ None - personalization limited';
  document.getElementById('persona-interests').textContent = interests;

  const goals = persona.currentGoals?.join(', ') || '⚠️ None - personalization limited';
  document.getElementById('persona-goals').textContent = goals;
  
  // Visual warning if incomplete
  const interestsEl = document.getElementById('persona-interests');
  const goalsEl = document.getElementById('persona-goals');
  
  if (!persona.interests || persona.interests.length === 0) {
    interestsEl.style.color = '#ff9800';
    interestsEl.style.fontStyle = 'italic';
  }
  
  if (!persona.currentGoals || persona.currentGoals.length === 0) {
    goalsEl.style.color = '#ff9800';
    goalsEl.style.fontStyle = 'italic';
  }
}

async function handleLogout() {
  await chrome.storage.local.clear();
  showLoginView();
  showStatus('Logged out', 'success');
}

async function handleRefresh() {
  showStatus('Refreshing persona...', 'success');
  chrome.runtime.sendMessage({ type: 'REFRESH_PERSONA' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      const message = chrome.runtime.lastError?.message || 'No response from background script';
      console.error('REFRESH_PERSONA error:', chrome.runtime.lastError);
      showStatus(message, 'error');
      return;
    }

    if (response && response.persona) {
      displayPersona(response.persona);
      showPersonaView();
      showStatus('Persona updated!', 'success');
    } else {
      showStatus('Could not refresh persona.', 'error');
      showLoginView();
    }
  });
}

function showLoginView() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('persona-view').classList.add('hidden');
}

function showPersonaView() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('persona-view').classList.remove('hidden');
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status show ${type || ''}`;

  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

// Initialize
init();
