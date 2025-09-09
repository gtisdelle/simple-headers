// DOM elements
const toggle = document.getElementById('toggle');
const status = document.getElementById('status');
const headerNameInput = document.getElementById('headerName');
const headerValueInput = document.getElementById('headerValue');
const addBtn = document.getElementById('addBtn');
const headersList = document.getElementById('headersList');

// State
let isEnabled = false;
let headers = [];

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadState();
    updateUI();
    setupEventListeners();
});

// Load state from storage
async function loadState() {
    try {
        const result = await chrome.storage.sync.get(['isEnabled', 'headers']);
        isEnabled = result.isEnabled || false;
        headers = result.headers || [];
    } catch (error) {
        console.error('Error loading state:', error);
    }
}

// Save state to storage
async function saveState() {
    try {
        await chrome.storage.sync.set({
            isEnabled,
            headers
        });
        
        // Notify service worker to update rules
        chrome.runtime.sendMessage({
            action: 'updateHeaders',
            headers: isEnabled ? headers : []
        });
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

// Update UI based on current state
function updateUI() {
    // Update toggle
    toggle.classList.toggle('active', isEnabled);
    status.textContent = isEnabled ? 'Enabled' : 'Disabled';
    status.className = `status ${isEnabled ? 'enabled' : 'disabled'}`;
    
    // Update headers list
    renderHeadersList();
    
    // Update add button state
    updateAddButtonState();
}

// Render headers list
function renderHeadersList() {
    if (headers.length === 0) {
        headersList.innerHTML = '<div class="empty-state"><p>No headers added yet</p></div>';
        return;
    }
    
    headersList.innerHTML = headers.map((header, index) => `
        <div class="header-item">
            <div class="header-info">
                <div class="header-name">${escapeHtml(header.name)}</div>
                <div class="header-value">${escapeHtml(header.value)}</div>
            </div>
            <button class="remove-btn" data-index="${index}">Remove</button>
        </div>
    `).join('');
}

// Update add button state
function updateAddButtonState() {
    const name = headerNameInput.value.trim();
    const value = headerValueInput.value.trim();
    addBtn.disabled = !name || !value || !isEnabled;
}

// Setup event listeners
function setupEventListeners() {
    // Toggle functionality
    toggle.addEventListener('click', toggleExtension);
    
    // Add header functionality
    addBtn.addEventListener('click', addHeader);
    
    // Input validation
    headerNameInput.addEventListener('input', updateAddButtonState);
    headerValueInput.addEventListener('input', updateAddButtonState);
    
    // Enter key support
    headerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            headerValueInput.focus();
        }
    });
    
    headerValueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !addBtn.disabled) {
            addHeader();
        }
    });
    
    // Event delegation for remove buttons
    headersList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            removeHeader(index);
        }
    });
}

// Toggle extension on/off
async function toggleExtension() {
    isEnabled = !isEnabled;
    updateUI();
    await saveState();
}

// Add new header
async function addHeader() {
    const name = headerNameInput.value.trim();
    const value = headerValueInput.value.trim();
    
    if (!name || !value || !isEnabled) {
        return;
    }
    
    // Check for duplicate header names
    if (headers.some(h => h.name.toLowerCase() === name.toLowerCase())) {
        alert('A header with this name already exists');
        return;
    }
    
    // Add header
    headers.push({ name, value });
    
    // Clear inputs
    headerNameInput.value = '';
    headerValueInput.value = '';
    
    // Update UI and save
    updateUI();
    await saveState();
}

// Remove header
async function removeHeader(index) {
    headers.splice(index, 1);
    updateUI();
    await saveState();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

