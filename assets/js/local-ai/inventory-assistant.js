/* Local-only inventory assistant UI. Load this after data.js and the app's other scripts. */
(() => {
  'use strict';
  if (window.__staMonicaInventoryAssistantLoaded) return;
  window.__staMonicaInventoryAssistantLoaded = true;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const localDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dayDifference = (date) => Math.round((new Date(`${date}T00:00:00`) - new Date(`${localDate()}T00:00:00`)) / 86400000);

  function buildInventorySnapshot() {
    // S is the app's existing in-memory state in data.js. No sales or manager-only data is sent.
    if (typeof S === 'undefined' || !S || !Array.isArray(S.products) || !Array.isArray(S.batches)) {
      throw new Error('The app inventory state was not found. Check that the assistant script is loaded after data.js.');
    }
    const today = localDate();
    const warningDays = Number(S.settings?.expWarnDays ?? 30);
    const products = S.products.map((product) => {
      const batches = S.batches
        .filter((batch) => String(batch.pid) === String(product.id) && Number(batch.qty) > 0)
        .map((batch) => {
          const expiry = batch.exp || null;
          const days = expiry ? dayDifference(expiry) : null;
          return {
            quantity: Number(batch.qty) || 0,
            expiry,
            expiryStatus: !expiry ? 'unknown' : days < 0 ? 'expired' : days <= warningDays ? 'soon' : 'ok'
          };
        });
      const stock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const active = product.active !== false;
      const status = !active ? 'inactive' : stock === 0 ? 'out' : stock <= Number(product.min || 0) ? 'low' : 'ok';
      return {
        code: product.code,
        name: product.name,
        unit: product.unit,
        active,
        stock,
        minimum: Number(product.min) || 0,
        status,
        batches
      };
    });
    return { today, warningDays, products };
  }

  const quickQuestions = [
    'Which products are low in stock?',
    'What products are out of stock?',
    'What will expire soon?',
    'Summarize the inventory status.'
  ];

  function installWidget() {
    if (!document.body || document.getElementById('smia-root')) return;
    const root = document.createElement('div');
    root.id = 'smia-root';
    root.innerHTML = `
      <button class="smia-launcher" id="smia-launcher" type="button" aria-label="Open inventory assistant" title="Inventory assistant">
        <span class="smia-launcher-icon" aria-hidden="true">✦</span><span class="smia-launcher-label">Inventory AI</span>
      </button>
      <section class="smia-panel" id="smia-panel" aria-label="Inventory assistant" hidden>
        <header class="smia-header">
          <div class="smia-avatar" aria-hidden="true">✦</div>
          <div class="smia-heading"><strong>Inventory Assistant</strong><span><i class="smia-status-dot"></i> Local AI · Inventory only</span></div>
          <button class="smia-close" id="smia-close" type="button" aria-label="Close assistant">×</button>
        </header>
        <div class="smia-local-note"><span aria-hidden="true">▣</span> Runs on this computer. Inventory questions only.</div>
        <div class="smia-messages" id="smia-messages" aria-live="polite" aria-relevant="additions">
          <div class="smia-message smia-bot"><div class="smia-bubble">Hi! I can help check stock levels, identify low-stock items, and find products that are expired or expiring soon. What would you like to know?</div><time>Inventory assistant</time></div>
        </div>
        <div class="smia-quick" id="smia-quick">${quickQuestions.map((q) => `<button type="button" data-smia-question="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        <form class="smia-form" id="smia-form">
          <label class="smia-sr-only" for="smia-input">Ask about inventory</label>
          <textarea id="smia-input" rows="1" maxlength="1200" placeholder="Ask about stock or expiry…" required></textarea>
          <button type="submit" id="smia-send" aria-label="Send message"><span aria-hidden="true">↑</span></button>
        </form>
        <footer class="smia-footer">AI can make mistakes. Verify important stock decisions in Stock Monitoring.</footer>
      </section>`;
    document.body.appendChild(root);

    const panel = root.querySelector('#smia-panel');
    const launcher = root.querySelector('#smia-launcher');
    const messages = root.querySelector('#smia-messages');
    const input = root.querySelector('#smia-input');
    const send = root.querySelector('#smia-send');
    const quick = root.querySelector('#smia-quick');

    function addMessage(text, role, label) {
      const item = document.createElement('div');
      item.className = `smia-message ${role === 'user' ? 'smia-user' : 'smia-bot'}`;
      item.innerHTML = `<div class="smia-bubble">${esc(text).replace(/\n/g, '<br>')}</div><time>${esc(label || (role === 'user' ? 'You' : 'Inventory assistant'))}</time>`;
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
      return item;
    }
    function togglePanel(open) {
      panel.hidden = !open;
      launcher.hidden = open;
      if (open) input.focus();
    }
    launcher.addEventListener('click', () => togglePanel(true));
    root.querySelector('#smia-close').addEventListener('click', () => togglePanel(false));
    quick.addEventListener('click', (event) => {
      const button = event.target.closest('[data-smia-question]');
      if (!button) return;
      input.value = button.dataset.smiaQuestion;
      root.querySelector('#smia-form').requestSubmit();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        root.querySelector('#smia-form').requestSubmit();
      }
    });

    async function sendMessage(question) {
      addMessage(question, 'user', 'You');
      quick.hidden = true;
      input.value = '';
      input.disabled = true;
      send.disabled = true;
      const thinking = addMessage('Checking the current inventory and preparing an answer…', 'bot', 'Local AI');
      thinking.classList.add('smia-thinking');
      try {
        const inventory = buildInventorySnapshot();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question, inventory })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'The local assistant could not answer.');
        thinking.remove();
        addMessage(result.reply, 'bot', 'Local AI · ' + (result.model || 'Ollama'));
      } catch (error) {
        thinking.remove();
        addMessage(error.message || 'Cannot connect to the local AI service. Check the setup steps.', 'bot', 'Connection issue');
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
        messages.scrollTop = messages.scrollHeight;
      }
    }
    root.querySelector('#smia-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (question && !send.disabled) sendMessage(question);
    });
  }

  function syncVisibility() {
    // Do not show the assistant on the login screen or when no user is signed in.
    const signedIn = typeof S !== 'undefined' && S && S.user;
    const loginPage = location.hash.startsWith('#/login') || !location.hash || location.hash === '#/';
    const root = document.getElementById('smia-root');
    if (!signedIn || loginPage) {
      if (root) root.hidden = true;
      return;
    }
    installWidget();
    const current = document.getElementById('smia-root');
    if (current) current.hidden = false;
  }

  window.addEventListener('hashchange', syncVisibility);
  window.addEventListener('DOMContentLoaded', syncVisibility);
  // The app replaces its #app content on navigation. This observer keeps the assistant available.
  const observer = new MutationObserver(() => syncVisibility());
  if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
  syncVisibility();
})();
