// Twin API URL
const TWIN_API = 'https://twin.erniesg.workers.dev';

chrome.runtime.onInstalled.addListener(() => {
  console.log("Twin Extension Installed/Updated.");
  // Prime the user ID check on install
  getUserId();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('[bg] message received:', message?.type);
  if (message.type === "PERSONALIZE_PAGE") {
    console.log("Twin Extension: Personalizing page with AI...");

    personalizeWithAI(message.pageInfo)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error("AI personalization error:", error);
        sendResponse({ error: error.message });
      });

      return true; // async response
    } else if (message.type === 'GET_USER_STATE') {
      // Popup is asking for user state - actively fetch it
      (async () => {
        try {
          console.log('[bg] GET_USER_STATE: Checking login...');
          const userId = await getUserId();

          if (userId) {
            console.log('[bg] User logged in:', userId);
            // Check if we have a cached persona
            const { persona } = await chrome.storage.local.get({ persona: null });

            if (!persona) {
              console.log('[bg] No cached persona, fetching...');
              const fetchedPersona = await fetchAndCachePersona(userId);
              sendResponse({ userId, persona: fetchedPersona });
            } else {
              console.log('[bg] Using cached persona');
              sendResponse({ userId, persona });
            }
          } else {
            console.log('[bg] No user logged in');
            sendResponse({ userId: null, persona: null });
          }
        } catch (e) {
          console.error('[bg] GET_USER_STATE error:', e);
          sendResponse({ userId: null, persona: null, error: e?.message || String(e) });
        }
      })();
      return true;
    } else if (message.type === 'REFRESH_PERSONA') {
      (async () => {
        try {
          const userId = await getUserId();
          if (userId) {
            const persona = await fetchAndCachePersona(userId);
            sendResponse({ persona });
          } else {
            sendResponse({ persona: null });
          }
        } catch (e) {
          console.error('[bg] REFRESH_PERSONA error:', e);
          sendResponse({ persona: null, error: e?.message || String(e) });
        }
      })();
      return true;
    }
  } catch (err) {
    console.error('[bg] onMessage handler top-level error:', err);
    try { sendResponse({ error: err?.message || String(err) }); } catch (_) {}
    return false;
  }
});

async function getUserId() {
  try {
    // Find a tab with the Twin app open
    const tabs = await chrome.tabs.query({ url: `${TWIN_API}/*` });

    if (tabs.length > 0) {
      // Read userId from localStorage on the Twin app tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => localStorage.getItem('twin_user_id')
      });

      const userId = results[0]?.result;
      console.log('[Twin] UserId from localStorage:', userId);

      if (userId) {
        await chrome.storage.local.set({ userId });
        return userId;
      }
    } else {
      console.log('[Twin] No Twin app tab open, cannot read localStorage');
    }
  } catch (error) {
    console.error('[Twin] getUserId error:', error);
  }

  // If localStorage check fails, clear stale data
  await chrome.storage.local.remove(['userId', 'persona']);
  return null;
}

async function fetchAndCachePersona(userId) {
  try {
    console.log('[Twin] Fetching persona from API...');

    // Get session token from localStorage
    const tabs = await chrome.tabs.query({ url: `${TWIN_API}/*` });

    if (tabs.length === 0) {
      throw new Error('Please open Twin dashboard first');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => localStorage.getItem('twin_session_token')
    });

    const token = results[0]?.result;
    console.log('[Twin] Token from localStorage:', token ? 'Found' : 'Not found');

    if (!token) {
      throw new Error('No session token - please visit Twin dashboard');
    }

    const response = await fetch(`${TWIN_API}/api/persona/get-with-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No persona found - please create one first');
      }
      if (response.status === 401) {
        throw new Error('Token expired - please visit Twin dashboard again');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.persona) {
      throw new Error('Invalid persona response');
    }

    const persona = data.persona;
    console.log('[Twin] Persona fetched successfully:', persona);

    // Validate persona has required data
    if (!persona || typeof persona !== 'object') {
      console.error('❌ [Twin] Persona is invalid or empty:', persona);
      throw new Error('Persona is empty or invalid');
    }

    const hasInterests = persona.interests && persona.interests.length > 0;
    const hasGoals = persona.currentGoals && persona.currentGoals.length > 0;
    
    if (!hasInterests && !hasGoals) {
      console.warn('⚠️ [Twin] Persona is missing interests and goals - personalization will be limited');
      console.warn('⚠️ Visit your dashboard to complete your persona setup');
    }

    await chrome.storage.local.set({ persona, lastFetched: Date.now() });
    return persona;
  } catch (error) {
    console.error('[Twin] Failed to load persona:', error);
    return null;
  }
}

async function personalizeWithAI(pageInfo) {
  console.log('[Twin] Starting personalization via backend API...');

  // Get session token from localStorage on Twin app tab
  const tabs = await chrome.tabs.query({ url: `${TWIN_API}/*` });

  if (tabs.length === 0) {
    throw new Error('Please open Twin dashboard first to authenticate');
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => localStorage.getItem('twin_session_token')
  });

  const token = results[0]?.result;

  if (!token) {
    throw new Error('No session token - please visit Twin dashboard');
  }

  console.log('[Twin] Token obtained, calling personalization API...');
  console.log('[Twin] Page info:', {
    hostname: pageInfo.hostname,
    url: pageInfo.url,
    domLength: pageInfo.simplifiedDOM?.length || 0
  });

  // Call backend API endpoint
  const response = await fetch(`${TWIN_API}/api/extension/personalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token,
      pageInfo
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `API error: ${response.status}`;
    console.error('[Twin] API error:', errorMessage);
    throw new Error(errorMessage);
  }

  const result = await response.json();

  console.log('[Twin] ✅ Personalization successful!');
  console.log(`[Twin] Received ${result.items?.length || 0} personalized items`);

  return result;
}