// Initialize with empty headers
let currentHeaders = [];

// Update dynamic rules based on stored headers
async function updateDynamicRules() {
  try {
    // Get current headers from storage
    const result = await chrome.storage.sync.get(['isEnabled', 'headers']);
    const isEnabled = result.isEnabled || false;
    const headers = result.headers || [];
    
    currentHeaders = headers;
    
    // Get existing rules and remove them
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);
    
    // Prepare the update operation
    const updateOperation = {
      removeRuleIds: ruleIdsToRemove
    };
    
    // Add new rule if extension is enabled and headers exist
    if (isEnabled && headers.length > 0) {
      const requestHeaders = headers.map(header => ({
        header: header.name,
        operation: "set",
        value: header.value
      }));
      
      updateOperation.addRules = [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: requestHeaders
          },
          condition: {
            urlFilter: "*"
          }
        }
      ];
    }
    
    // Perform the update in a single operation
    await chrome.declarativeNetRequest.updateDynamicRules(updateOperation);
    
  } catch (error) {
    console.error('Error updating dynamic rules:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateHeaders') {
    updateDynamicRules();
    sendResponse({ success: true });
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  updateDynamicRules();
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  updateDynamicRules();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.isEnabled || changes.headers)) {
    updateDynamicRules();
  }
});

// Initial update
updateDynamicRules();
