
(function() {
    'use strict';

    const blockMenuPathSnippet = 'M12 3.75c-4.55';
    const blockSvg = `
        &lt;svg viewBox="0 0 24 24" aria-hidden="true" class="quick-block-svg"&gt;
            &lt;g&gt;&lt;path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.87.64-3.6 1.72-5.01l11.29 11.29C15.6 19.36 13.87 20 12 20zm6.28-2.99L6.99 5.72C8.4 4.64 10.13 4 12 4c4.41 0 8 3.59 8 8 0 1.87-.64 3.6-1.72 5.01z"&gt;&lt;/path&gt;&lt;/g&gt;
        &lt;/svg&gt;
    `;
    const btnStyle = `
        background-color: transparent;
        border: none;
        border-radius: 9999px;
        width: 30px;
        height: 30px;
        margin-right: 2px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        z-index: 10;
    `;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .quick-block-svg {
            width: 18px;
            height: 18px;
            fill: #71767b;
            transition: fill 0.2s ease-in-out;
        }
        .quick-block-btn-feed:hover .quick-block-svg,
        .quick-block-btn-profile:hover .quick-block-svg {
            fill: rgb(244, 33, 46);
        }
        .quick-block-btn-feed:hover,
        .quick-block-btn-profile:hover {
            background-color: rgba(244, 33, 46, 0.1) !important;
        }
        .quick-block-btn-profile {
            margin-left: 8px;
            margin-right: 8px;
        }
    `;
    document.head.appendChild(styleSheet);

    const randomDelay = (min, max) =&gt;
        new Promise(res =&gt; setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));

    function getLoggedUsername() {
        const accountBtn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
        if (!accountBtn) return null;
        const usernameSpan = accountBtn.querySelector('span');
        const allSpans = accountBtn.querySelectorAll('span');
        for (let span of allSpans) {
            const text = span.textContent.trim();
            if (text.startsWith('@')) {
                return text.substring(1);
            }
        }
        const avatarContainer = accountBtn.querySelector('[data-testid^="UserAvatar-Container-"]');
        if (avatarContainer) {
            return avatarContainer.getAttribute('data-testid').replace('UserAvatar-Container-', '');
        }
        return null;
    }

    function getProfileUsernameFromPath() {
        const m = window.location.pathname.match(/^\/([^\/?#]+)/);
        return m ? m[1] : null;
    }

    function isOwnTweet(tweet, loggedUsername) {
        if (!loggedUsername) return false;
        const analyticsLink = tweet.querySelector('a[href$="/analytics"]');
        if (!analyticsLink) return false;
        const href = analyticsLink.getAttribute('href');
        const regex = new RegExp(`^\\/${loggedUsername}\\/status\\/\\d+\\/analytics$`);
        return regex.test(href);
    }

    async function performBlock(triggerElement) {
        if (!triggerElement) return;
        triggerElement.click();
        await randomDelay(50, 100);
        const menuItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]');
        const blockOption = Array.from(menuItems).find(item =&gt; {
            const pathEl = item.querySelector('svg path');
            const d = pathEl &amp;&amp; pathEl.getAttribute &amp;&amp; pathEl.getAttribute('d');
            return d &amp;&amp; d.includes(blockMenuPathSnippet);
        });
        if (blockOption) {
            blockOption.click();
            await randomDelay(50, 100);
            const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
            if (confirmBtn) confirmBtn.click();
        } else {
            triggerElement.click();
        }
    }

    function createBlockBtnForCaret(caret) {
        const btn = document.createElement('button');
        btn.innerHTML = blockSvg;
        btn.setAttribute('style', btnStyle);
        btn.className = 'quick-block-btn-feed';
        btn.title = 'Block user';
        btn.onclick = (e) =&gt; {
            e.preventDefault();
            e.stopPropagation();
            performBlock(caret);
        };
        return btn;
    }

    function createBlockBtnForProfile(moreButton) {
        const btn = moreButton.cloneNode(true);
        btn.removeAttribute('data-testid');
        btn.removeAttribute('aria-expanded');
        btn.removeAttribute('aria-haspopup');
        btn.classList.add('quick-block-btn-profile');
        btn.setAttribute('style', moreButton.getAttribute('style') || '');
        const svgContainer = btn.querySelector('svg');
        if (svgContainer) {
            svgContainer.outerHTML = `
                &lt;svg viewBox="0 0 24 24" aria-hidden="true" class="${svgContainer.className.baseVal}"&gt;
                    &lt;g&gt;
                        &lt;path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.87.64-3.6 1.72-5.01l11.29 11.29C15.6 19.36 13.87 20 12 20zm6.28-2.99L6.99 5.72C8.4 4.64 10.13 4 12 4c4.41 0 8 3.59 8 8 0 1.87-.64 3.6-1.72 5.01z"&gt;&lt;/path&gt;
                    &lt;/g&gt;
                &lt;/svg&gt;
            `;
        }
        btn.onclick = (e) =&gt; {
            e.preventDefault();
            e.stopPropagation();
            performBlock(moreButton);
        };
        return btn;
    }

    function injectFeedButtons(loggedUsername) {
        if (!loggedUsername) return;
        const tweets = document.querySelectorAll('[data-testid="tweet"]');
        tweets.forEach(tweet =&gt; {
            if (tweet.querySelector('.quick-block-btn-feed')) return;
            if (isOwnTweet(tweet, loggedUsername)) return;
            const caret = tweet.querySelector('[data-testid="caret"]');
            if (caret &amp;&amp; caret.parentNode) {
                const blockBtn = createBlockBtnForCaret(caret);
                caret.parentNode.insertBefore(blockBtn, caret);
            }
        });
    }

    function injectProfileButton(loggedUsername) {
        const profileUsername = getProfileUsernameFromPath();
        if (!profileUsername) return;
        if (!loggedUsername) return;
        if (profileUsername === loggedUsername) return;
        const moreButton = document.querySelector('[data-testid="userActions"]');
        if (!moreButton) return;
        const parent = moreButton.parentNode;
        if (!parent) return;
        if (parent.querySelector('.quick-block-btn-profile')) return;
        const blockBtn = createBlockBtnForProfile(moreButton);
        parent.insertBefore(blockBtn, moreButton);
    }

    function injectAll() {
        const loggedUsername = getLoggedUsername();
        if (!loggedUsername) return;
        injectFeedButtons(loggedUsername);
        injectProfileButton(loggedUsername);
    }

    let timeout = null;
    const observer = new MutationObserver(() =&gt; {
        clearTimeout(timeout);
        timeout = setTimeout(injectAll, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    injectAll();
})();

