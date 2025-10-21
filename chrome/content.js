// Twin Extension - Content Script
// Injects a personalize button on every page

console.log('[Twin] Content script loaded');

let personalizeButton = null;
let animationOverlay = null;
let originalContent = null;

// Inject personalize button on page load
injectPersonalizeButton();

function injectPersonalizeButton() {
  // Don't inject if already exists
  if (personalizeButton) {
    return true;
  }

  // Try to find main content area on ANY site
  const contentSelectors = [
    'ytd-rich-grid-renderer',  // YouTube
    '[role="main"]',            // Many sites
    'main',                     // Semantic HTML
    '#content',                 // Common ID
    '.content',                 // Common class
    'article',                  // News sites
    '[class*="main"]',          // Any class containing "main"
    'body'                      // Fallback to body
  ];

  let contentElement = null;
  let selectorUsed = null;
  
  for (const selector of contentSelectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) {
      selectorUsed = selector;
      break;
    }
  }

  if (contentElement) {
    console.log('[Twin] ✅ Found content area using selector:', selectorUsed);
    console.log('[Twin] Creating personalize button');

    personalizeButton = document.createElement('div');
    personalizeButton.id = 'twin-personalize-btn';
    personalizeButton.innerHTML = `
      <button class="personalize-button">
        <div class="button-gradient"></div>
        <span class="button-text">personalize</span>
        <div class="button-shimmer"></div>
      </button>
    `;

    // Insert at the very top of the page for visibility
    if (contentElement.parentNode && contentElement.parentNode !== document.documentElement) {
    contentElement.parentNode.insertBefore(personalizeButton, contentElement);
    } else {
      // Fallback: insert at beginning of body
      document.body.insertBefore(personalizeButton, document.body.firstChild);
    }

    const button = personalizeButton.querySelector('.personalize-button');
    button.addEventListener('click', handlePersonalizeClick);
    
    console.log('[Twin] ✅ Button injected successfully');
    return true;
  } else {
    console.log('[Twin] ⏳ Waiting for content area to load...');
    return false;
  }
}

async function handlePersonalizeClick() {
  console.log('[Twin] Initiating personalization...');

  // Check if Chrome extension APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    console.error('[Twin] Chrome extension APIs not available. Extension may have been reloaded.');
    showReloadError();
    return;
  }

  // Create and show breathing circle animation
  if (!animationOverlay) {
    createAnimationOverlay();
  }

  animationOverlay.classList.add('active');

  if (personalizeButton) {
    personalizeButton.style.opacity = '0';
    personalizeButton.style.transform = 'scale(0.8)';
  }

  let success = false;

  try {
    // Wait a bit for dynamic content to load (especially YouTube)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Collect page information
    const pageInfo = {
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
      simplifiedDOM: getSimplifiedDOM(),
      styling: getPageStyling()
    };

    console.log('[Twin] 📤 Sending page info to background:', pageInfo);

    // Send to background script for AI personalization
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'PERSONALIZE_PAGE', pageInfo },
        (response) => {
          if (chrome.runtime.lastError) {
            // Check for extension context invalidated error
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
              console.error('[Twin] Extension was reloaded. Please reload this page.');
              showReloadError();
              reject(new Error('Extension reloaded'));
              return;
            }
            
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(response);
        }
      );
    });

    console.log('[Twin] 📥 Received response:', response);

    // Find main content area
    const contentSelectors = [
      'ytd-rich-grid-renderer',
      '[role="main"]',
      'main',
      '#content',
      '.content'
    ];

    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    if (contentElement) {
      // Save original content
      originalContent = contentElement;
      contentElement.style.display = 'none';
    }

    // Handle different response types
    if (response && response.noRelevantContent) {
      console.log('[Twin] 💡 No relevant content - showing suggestions');
      injectNoContentMessage(response);
      success = true;
    } else if (response && response.items) {
      console.log('[Twin] ✅ Personalization successful!');
      renderTinderStyleFeed(response.items);
      success = true;
    } else if (response && response.html) {
      console.log('[Twin] ✅ Using AI-generated HTML');
      injectPersonalizedContent(response);
      success = true;
    } else if (response && response.error) {
      console.error('[Twin] ❌ API Error:', response.error);
      showErrorView(response.error);
    } else {
      console.error('[Twin] ❌ Invalid response:', response);
      showErrorView('No content received from AI');
    }

  } catch (error) {
    console.error('[Twin] ❌ Personalization error:', error);
    showErrorView(error.message);
  } finally {
    // Hide animation
    if (animationOverlay) {
      animationOverlay.classList.remove('active');
      setTimeout(() => {
        if (animationOverlay) {
          animationOverlay.remove();
          animationOverlay = null;
        }
        // Only remove button on success
        if (success && personalizeButton) {
          personalizeButton.remove();
          personalizeButton = null;
        } else if (personalizeButton) {
          // Reset button state on error so user can try again
          personalizeButton.style.opacity = '1';
          personalizeButton.style.transform = 'scale(1)';
        }
      }, 600);
    }
  }
}

function createAnimationOverlay() {
  animationOverlay = document.createElement('div');
  animationOverlay.id = 'twin-animation-overlay';
  animationOverlay.innerHTML = `
    <div class="twin-loader">
      <div class="pulse-circle"></div>
      <div class="pulse-circle"></div>
      <div class="pulse-circle"></div>
      <div class="center-dot"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
    </div>
    <div class="loading-text">personalizing...</div>
  `;
  document.body.appendChild(animationOverlay);
}

async function renderTinderStyleFeed(items) {
  if (!items || items.length === 0) {
    showErrorView('No content found to personalize');
    return;
  }

  console.log('[Twin] Rendering feed with items:', items);

  // Create container
  const container = document.createElement('div');
  container.id = 'twin-personalized-feed';

  // Create grid using CSS classes
  const grid = document.createElement('div');
  grid.className = 'cards-grid';

  // Create cards
  items.forEach(async (item, index) => {
    const card = await createCard(item, index);
    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Insert into page
  if (originalContent && originalContent.parentNode) {
    originalContent.parentNode.insertBefore(container, originalContent);
  } else if (document.body.firstChild) {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }

  console.log(`✅ Created personalized feed with ${items.length} cards`);
}

async function createCard(item, index) {
  const card = document.createElement('div');
  card.className = 'content-card';
  
  const link = document.createElement('a');
  link.href = item.url;
  link.target = '_blank';

  // Try to get image from URL metadata
  let imageUrl = item.imageUrl || item.image || item.thumbnail || item.thumbnailUrl || item.img || item.preview;

  // Don't fetch images - rely on what the AI extracted from the DOM
  // Fetching causes CORS issues and returns wrong images (like Reddit's favicon)

  console.log(`[Twin] Card ${index}:`, {
    title: item.title,
    imageUrl: imageUrl,
    allFields: Object.keys(item)
  });

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'card-image';
  
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = item.title || '';
    
    // Add error handler
    img.addEventListener('error', () => {
      imageContainer.innerHTML = '📄';
    });
    
    imageContainer.appendChild(img);
  } else {
    imageContainer.textContent = '📄';
  }

  link.appendChild(imageContainer);

  // Create content section
  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = item.title || 'Untitled';
  content.appendChild(title);

  // Add metadata if available
  if (item.metadata || item.score) {
    const metadata = document.createElement('div');
    metadata.className = 'card-metadata';
    
    if (item.score) {
      const scoreSpan = document.createElement('span');
      scoreSpan.textContent = `Match: ${item.score}`;
      metadata.appendChild(scoreSpan);
    }
    
    // Add any other metadata
    if (item.metadata) {
      for (const [key, value] of Object.entries(item.metadata)) {
        if (value) {
          const metaSpan = document.createElement('span');
          metaSpan.textContent = `${key}: ${value}`;
          metadata.appendChild(metaSpan);
        }
      }
    }
    
    content.appendChild(metadata);
  }

  if (item.reason) {
    const reason = document.createElement('div');
    reason.className = 'card-reason';
    reason.textContent = item.reason;
    content.appendChild(reason);
  }

  link.appendChild(content);
  card.appendChild(link);
  return card;
}


function injectPersonalizedContent(response) {
  // Remove existing personalized content if any
  const existing = document.getElementById('twin-personalized-feed');
  if (existing) {
    existing.remove();
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'twin-personalized-feed';
  container.innerHTML = response.html;

  // Inject CSS
  if (response.css) {
    const style = document.createElement('style');
    style.id = 'twin-personalized-styles';
    style.textContent = response.css;
    document.head.appendChild(style);
  }

  // Insert at top of page
  if (originalContent && originalContent.parentNode) {
    originalContent.parentNode.insertBefore(container, originalContent);
  } else if (document.body.firstChild) {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }

  // Scroll to personalized content
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function injectNoContentMessage(response) {
  // Remove existing content if any
  const existing = document.getElementById('twin-personalized-feed');
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = 'twin-personalized-feed';
  container.className = 'twin-no-content';

  let suggestionsHTML = '';
  if (response.suggestions && response.suggestions.length > 0) {
    suggestionsHTML = response.suggestions.map(s => `
      <a href="${s.url}" target="_blank" class="twin-suggestion">
        <div class="twin-suggestion-emoji">${s.emoji || '🎯'}</div>
        <div class="twin-suggestion-content">
          <div class="twin-suggestion-title">${s.title}</div>
          <div class="twin-suggestion-reason">${s.reason}</div>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    `).join('');
  }

  container.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 16px;">🤔</div>
    <h2>Nothing for You Here</h2>
    <p>${response.message || "This page doesn't match your interests. Here's where you should be instead!"}</p>
    ${suggestionsHTML ? `
      <div style="margin-top: 32px; text-align: left;">
        <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">Try These Instead:</h3>
        ${suggestionsHTML}
      </div>
    ` : ''}
  `;

  // Insert into page
  if (originalContent && originalContent.parentNode) {
    originalContent.parentNode.insertBefore(container, originalContent);
  } else if (document.body.firstChild) {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showErrorView(message) {
  const container = document.createElement('div');
  container.id = 'twin-personalized-feed';
  container.style.cssText = `
    padding: 40px;
    text-align: center;
    color: #ff6b6b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  container.innerHTML = `
    <h2 style="font-size: 24px; margin-bottom: 16px;">Oops! Something went wrong</h2>
    <p style="font-size: 16px; color: #999;">${message}</p>
    <p style="font-size: 12px; color: #666; margin-top: 20px;">Check the console for more details</p>
  `;

  if (originalContent && originalContent.parentNode) {
    originalContent.parentNode.insertBefore(container, originalContent);
  } else if (document.body.firstChild) {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }
}

function showReloadError() {
  const container = document.createElement('div');
  container.id = 'twin-personalized-feed';
  container.style.cssText = `
    padding: 40px;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  container.innerHTML = `
    <div style="max-width: 500px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #ff9800 0%, #ff6b00 100%); border-radius: 16px; color: white;">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <h2 style="font-size: 24px; margin-bottom: 12px;">Extension Reloaded</h2>
      <p style="opacity: 0.95; margin-bottom: 24px;">The Twin extension was updated. Please reload this page to continue.</p>
      <button onclick="window.location.reload()" style="
        padding: 12px 32px;
        background: white;
        color: #ff9800;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
        Reload Page Now
      </button>
    </div>
  `;

  if (document.body.firstChild) {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }
}

function getSimplifiedDOM() {
  // Extract main content elements with metadata
  const mainContent = document.querySelector('main') || document.body;
  
  // Comprehensive selectors for different types of websites
  const selectors = [
    // YouTube
    'ytd-video-renderer', 'ytd-grid-video-renderer', 'ytd-rich-item-renderer',
    // Reddit
    'shreddit-post',
    // Generic articles & posts
    'article', '[role="article"]',
    // Common news site patterns
    '[class*="article"]', '[class*="story"]', '[class*="post"]', '[class*="card"]',
    '[class*="item"]', '[class*="entry"]', '[class*="content-item"]',
    // Data attributes
    '[data-id]', '[data-article]', '[data-story]', '[data-post-id]',
    // Headings with links (common pattern)
    'h2:has(a)', 'h3:has(a)', 'h4:has(a)'
  ].join(', ');
  
  let items = mainContent.querySelectorAll(selectors);
  
  // Fallback: if nothing found, look for any links with headlines
  if (items.length === 0) {
    console.log('[Twin] No structured items found, trying fallback...');
    items = mainContent.querySelectorAll('a[href]:has(h1, h2, h3, h4, h5, h6), div:has(> a > h2), div:has(> a > h3)');
  }
  
  // Ultimate fallback: just get all links with substantial text
  if (items.length === 0) {
    console.log('[Twin] Still no items, using ultimate fallback: all meaningful links');
    const allLinks = Array.from(mainContent.querySelectorAll('a[href]'));
    items = allLinks.filter(link => {
      const text = link.textContent?.trim() || '';
      // Only include links with at least 20 characters of text
      return text.length > 20 && 
             !link.href.includes('javascript:') && 
             !link.href.startsWith('#') &&
             link.href !== window.location.href;
    });
  }

  console.log(`[Twin] Found ${items.length} content items to extract`);

  let dom = '';
  items.forEach((item, index) => {
    if (index < 50) { // Limit to first 50 items
      // Extract text
      let text = item.textContent?.trim().substring(0, 500);
      
      // YouTube-specific: extract title from element
      const ytTitle = item.querySelector('#video-title, h3 a, #video-title-link');
      if (ytTitle) {
        text = ytTitle.textContent?.trim() || ytTitle.getAttribute('title') || text;
      }
      
      // Try to find image URL
      let imageUrl = null;
      
      // YouTube-specific: look for thumbnail
      const ytThumbnail = item.querySelector('img#img, ytd-thumbnail img, img[src*="ytimg"]');
      if (ytThumbnail && ytThumbnail.src) {
        imageUrl = ytThumbnail.src;
      }
      
      // Reddit-specific: look for thumbnail
      if (!imageUrl) {
        // Try to find actual post images (preview.redd.it or external-preview.redd.it)
        const thumbnail = item.querySelector('img[src*="preview.redd.it"], img[src*="external-preview.redd.it"]');
        if (thumbnail && thumbnail.src) {
          imageUrl = thumbnail.src;
        } else {
          // Fallback: any Reddit image but exclude static assets
          const anyImg = item.querySelector('img[src*="redd.it"]');
          if (anyImg && anyImg.src &&
              !anyImg.src.includes('redditstatic.com') &&
              !anyImg.src.includes('icon.png') &&
              !anyImg.src.includes('default') &&
              !anyImg.src.includes('favicon')) {
            imageUrl = anyImg.src;
          }
        }
      }
      
      // Try data attributes
      if (!imageUrl) {
        imageUrl = item.getAttribute('data-image') || 
                   item.getAttribute('data-thumbnail') ||
                   item.querySelector('[data-image]')?.getAttribute('data-image');
      }
      
      // Look for any img tag
      if (!imageUrl) {
        const img = item.querySelector('img[src]');
        if (img && img.src && !img.src.includes('icon.png') && !img.src.includes('avatar')) {
          imageUrl = img.src;
        }
      }
      
      // Try to find URL
      let url = null;
      
      // YouTube-specific: extract video URL
      const ytLink = item.querySelector('a#video-title-link, a#thumbnail, a[href*="/watch"]');
      if (ytLink) {
        url = ytLink.href;
      }
      
      if (!url) {
        const link = item.querySelector('a[href]');
        url = link?.href;
      }
      
      if (text || url) {
        dom += `ITEM ${index}:\n`;
        if (text) dom += `Text: ${text}\n`;
        if (url) dom += `URL: ${url}\n`;
        if (imageUrl) dom += `Image: ${imageUrl}\n`;
        dom += '---\n';
      }
    }
  });

  console.log(`[Twin] Extracted DOM length: ${dom.length} characters`);
  return dom.substring(0, 20000); // Increased limit to include URLs and images
}

function getPageStyling() {
  const computedStyle = window.getComputedStyle(document.body);
  return {
    backgroundColor: computedStyle.backgroundColor,
    color: computedStyle.color,
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize
  };
}

// Re-inject button if page dynamically loads content
let attempts = 0;
const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)

const checkInterval = setInterval(() => {
  attempts++;
  const success = injectPersonalizeButton();
  
  if (success) {
    console.log('[Twin] ✅ Button injection complete, stopping retry');
    clearInterval(checkInterval);
  } else if (attempts >= maxAttempts) {
    console.log('[Twin] ⚠️ Could not find content area after 10 seconds, stopping retry');
    clearInterval(checkInterval);
  }
}, 500);
