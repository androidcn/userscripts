// ==UserScript==
// @name         One-Click X/Twitter Block
// @version      1.3.0
// @description  One-click block button next to every username on X/Twitter.
// @author       linuxmaster14
// @license      MIT
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function () {
    'use strict';
    const ATTR = 'data-x-blk';
    const STORAGE_KEY = 'x_pending_block_user';
    const BLOCKED_KEY = 'x_blocked_users';
    const POLL_INTERVAL = 100;
    const POLL_TIMEOUT = 3000;
    const REDIRECT_POLL_INTERVAL = 400;
    const REDIRECT_POLL_MAX = 30;
    const DEBOUNCE_MS = 300;
    const EXCLUDE_SELECTORS = 'nav[aria-label="Primary"], [data-testid="sidebarColumn"]';
    const RESERVED = new Set([
        'home', 'explore', 'search', 'notifications', 'messages',
        'settings', 'i', 'compose', 'login', 'logout', 'signup',
        'tos', 'privacy', 'hashtag', 'lists', 'communities',
    ]);
    function getMyUsername() {
        const link = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
        if (link) {
            const m = link.getAttribute('href')?.match(/^\/([A-Za-z0-9_]+)$/);
            if (m) return m[1].toLowerCase();
        }
        return null;
    }
    // Blocked users storage
    function getBlockedUsers() {
        try { return new Set(JSON.parse(localStorage.getItem(BLOCKED_KEY) || '[]')); }
        catch { return new Set(); }
    }
    function addBlockedUser(username) {
        const set = getBlockedUsers();
        set.add(username.toLowerCase());
        localStorage.setItem(BLOCKED_KEY, JSON.stringify([...set]));
    }
    function isBlocked(username) {
        return getBlockedUsers().has(username.toLowerCase());
    }
    function getUsernameFromCell(cell) {
        for (const a of cell.querySelectorAll('a[href^="/"]')) {
            const m = a.getAttribute('href').match(/^\/([A-Za-z0-9_]{1,15})$/);
            if (m && !RESERVED.has(m[1].toLowerCase())) return m[1];
        }
        return null;
    }
    function hideBlockedCells() {
        for (const cell of document.querySelectorAll('[data-testid="UserCell"]')) {
            if (cell.style.display === 'none') continue;
            const username = getUsernameFromCell(cell);
            if (!username) continue;
            if (isBlocked(username)) {
                cell.style.display = 'none';
                continue;
            }
            // Also detect X's native "Blocked" state
            const btns = cell.querySelectorAll('[role="button"]');
            for (const b of btns) {
                const txt = b.textContent.trim().toLowerCase();
                if (txt === 'blocked' || txt === 'unblock') {
                    addBlockedUser(username);
                    cell.style.display = 'none';
                    break;
                }
            }
        }
    }
    // Icon + button
    function createBlockIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#e0245e');
        svg.setAttribute('stroke-width', '2.5');
        svg.setAttribute('stroke-linecap', 'round');
        svg.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>';
        return svg;
    }
    function createBlockButton() {
        const btn = document.createElement('span');
        btn.setAttribute(ATTR, '1');
        btn.title = 'Block';
        btn.setAttribute('role', 'button');
        Object.assign(btn.style, {
            position: 'absolute',
            right: '-20px',
            top: '2px',
            background: 'none',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            opacity: '0.7',
            lineHeight: '0',
        });
        btn.appendChild(createBlockIcon());
        btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
        btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.7'; });
        return btn;
    }
    // Block flow
    function poll(fn, interval, timeout) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const id = setInterval(() => {
                const result = fn();
                if (result) { clearInterval(id); resolve(result); }
                else if (Date.now() - start > timeout) { clearInterval(id); reject(new Error('poll timeout')); }
            }, interval);
        });
    }
    function isExcluded(el) { return el.closest(EXCLUDE_SELECTORS); }
    function findMoreButton(scope) {
        const sel = '[aria-label="More"][role="button"], [data-testid="userActions"]';
        for (const c of scope.querySelectorAll(sel)) {
            if (!isExcluded(c)) return c;
        }
        return null;
    }
    function findOverlayMenuItem(label) {
        const overlays = document.querySelectorAll('[role="menu"], [data-testid="Dropdown"], [data-testid="dropdownMenu"]');
        for (const overlay of overlays) {
            if (isExcluded(overlay)) continue;
            for (const item of overlay.querySelectorAll('[role="menuitem"], [data-testid="block"], span')) {
                if (item.textContent.trim().toLowerCase().startsWith(label.toLowerCase())) {
                    return item.closest('[role="menuitem"]') || item;
                }
            }
        }
        return null;
    }
    function findConfirmButton() {
        const dialogs = document.querySelectorAll('[role="alertdialog"], [role="dialog"], [data-testid="confirmationSheetDialog"]');
        for (const dialog of dialogs) {
            for (const btn of dialog.querySelectorAll('[data-testid="confirmationSheetConfirm"], [role="button"], button')) {
                const txt = btn.textContent.trim().toLowerCase();
                if (txt === 'block' || txt.startsWith('block')) return btn;
            }
        }
        return null;
    }
    async function executeBlockFlow(scope) {
        const moreBtn = findMoreButton(scope);
        if (!moreBtn) throw new Error('More button not found');
        moreBtn.click();
        const blockItem = await poll(() => findOverlayMenuItem('block @') || findOverlayMenuItem('block'), POLL_INTERVAL, POLL_TIMEOUT);
        blockItem.click();
        const confirmBtn = await poll(findConfirmButton, POLL_INTERVAL, POLL_TIMEOUT);
        confirmBtn.click();
    }
    // Click handler
    function handleBlockClick(username, contextEl) {
        return async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const cell = contextEl.closest('[data-testid="UserCell"]');
            if (cell) {
                try {
                    await executeBlockFlow(cell);
                    addBlockedUser(username);
                    cell.style.display = 'none';
                    return;
                } catch {}
            }
            const profileUser = getProfileUsername();
            if (profileUser && profileUser.toLowerCase() === username.toLowerCase()) {
                const col = document.querySelector('[data-testid="primaryColumn"]');
                if (col) {
                    try {
                        await executeBlockFlow(col);
                        addBlockedUser(username);
                        return;
                    } catch {}
                }
            }
            localStorage.setItem(STORAGE_KEY, username);
            location.href = `https://x.com/${username}`;
        };
    }
    // Universal injection
    function getProfileUsername() {
        const m = location.pathname.match(/^\/([A-Za-z0-9_]{1,15})(\/.*)?$/);
        return (m && !RESERVED.has(m[1].toLowerCase())) ? m[1] : null;
    }
    function hasTimeNearby(link) {
        const tweet = link.closest('article[data-testid="tweet"]');
        if (!tweet) return false;
        let el = link.parentElement;
        for (let i = 0; i < 4 && el && el !== tweet; i++) {
            if (el.querySelector('time[datetime]')) return true;
            el = el.parentElement;
        }
        return false;
    }
    function hasUsernameNearby(timeLink, username) {
        let el = timeLink.parentElement;
        for (let i = 0; i < 4 && el; i++) {
            const found = el.querySelector('a[href="/' + username + '"]');
            if (found && found.textContent.trim().startsWith('@')) return true;
            el = el.parentElement;
        }
        return false;
    }
    function injectOnUsernameLinks() {
        const me = getMyUsername();
        for (const link of document.querySelectorAll('a[role="link"][href^="/"]')) {
            if (link.hasAttribute(ATTR)) continue;
            if (isExcluded(link)) continue;
            const hrefMatch = link.getAttribute('href').match(/^\/([A-Za-z0-9_]{1,15})$/);
            if (!hrefMatch) continue;
            const text = link.textContent.trim();
            if (!text.startsWith('@')) continue;
            if (link.closest('[data-testid="UserDescription"]')) continue;
            if (link.closest('[data-testid="tweetText"]')) continue;
            // In tweets: if there's an inline time nearby, let timestamp handle it
            if (hasTimeNearby(link)) continue;
            const username = hrefMatch[1];
            const cell = link.closest('[data-testid="UserCell"]');
            if (cell) {
                const cellUser = getUsernameFromCell(cell);
                if (cellUser && cellUser.toLowerCase() !== username.toLowerCase()) continue;
            }
            if (RESERVED.has(username.toLowerCase())) continue;
            if (me && username.toLowerCase() === me) continue;
            link.setAttribute(ATTR, '1');
            link.style.position = 'relative';
            const btn = createBlockButton();
            btn.setAttribute('data-x-block-user', username);
            btn.addEventListener('click', handleBlockClick(username, link));
            link.appendChild(btn);
        }
    }
    function injectOnTimestamps() {
        const me = getMyUsername();
        for (const timeEl of document.querySelectorAll('time[datetime]')) {
            const timeLink = timeEl.closest('a[href]');
            if (!timeLink) continue;
            if (timeLink.hasAttribute(ATTR)) continue;
            if (isExcluded(timeLink)) continue;
            const hrefMatch = timeLink.getAttribute('href').match(/^\/([A-Za-z0-9_]{1,15})\/status\//);
            if (!hrefMatch) continue;
            const username = hrefMatch[1];
            if (RESERVED.has(username.toLowerCase())) continue;
            if (me && username.toLowerCase() === me) continue;
            // Only show if @username is nearby (same header row)
            if (!hasUsernameNearby(timeLink, username)) continue;
            timeLink.setAttribute(ATTR, '1');
            timeLink.style.position = 'relative';
            const btn = createBlockButton();
            btn.setAttribute('data-x-block-user', username);
            btn.addEventListener('click', handleBlockClick(username, timeLink));
            timeLink.appendChild(btn);
        }
    }
    function injectOnProfile() {
        const me = getMyUsername();
        const username = getProfileUsername();
        if (!username) return;
        if (me && username.toLowerCase() === me) return;
        const col = document.querySelector('[data-testid="primaryColumn"]');
        if (!col) return;
        // Already injected for this profile
        const existing = col.querySelector(`[data-x-profile-blk]`);
        if (existing) {
            if (existing.getAttribute('data-x-block-user') === username.toLowerCase()) return;
            existing.remove();
        }
        // Find the @username link in the profile header (not in tweets or bio)
        let handleLink = null;
        for (const l of col.querySelectorAll('a[role="link"][href="/' + username + '"]')) {
            if (!l.textContent.trim().startsWith('@')) continue;
            if (l.closest('article[data-testid="tweet"]')) continue;
            if (l.closest('[data-testid="UserDescription"]')) continue;
            handleLink = l;
            break;
        }
        if (!handleLink) return;
        handleLink.setAttribute(ATTR, '1');
        handleLink.style.position = 'relative';
        const btn = createBlockButton();
        btn.setAttribute('data-x-profile-blk', '1');
        btn.setAttribute('data-x-block-user', username.toLowerCase());
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            try {
                await executeBlockFlow(col);
                addBlockedUser(username);
            } catch {
                localStorage.setItem(STORAGE_KEY, username);
                location.reload();
            }
        });
        handleLink.appendChild(btn);
    }
    // Auto-block on redirect
    async function handlePendingBlock() {
        const pending = localStorage.getItem(STORAGE_KEY);
        if (!pending) return;
        const current = getProfileUsername();
        if (!current || current.toLowerCase() !== pending.toLowerCase()) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        try {
            const scope = await poll(() => {
                const col = document.querySelector('[data-testid="primaryColumn"]');
                if (!col) return null;
                return findMoreButton(col) ? col : null;
            }, REDIRECT_POLL_INTERVAL, REDIRECT_POLL_INTERVAL * REDIRECT_POLL_MAX);
            await new Promise(r => setTimeout(r, 300));
            await executeBlockFlow(scope);
            addBlockedUser(pending);
            localStorage.removeItem(STORAGE_KEY);
            history.back();
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    // Observer + SPA polling
    function runAll() {
        injectOnUsernameLinks();
        injectOnTimestamps();
        injectOnProfile();
        hideBlockedCells();
    }
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runAll, DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    let lastHref = location.href;
    setInterval(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            setTimeout(runAll, DEBOUNCE_MS);
        }
    }, 1000);
    runAll();
    handlePendingBlock();
})();

