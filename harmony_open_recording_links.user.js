// ==UserScript==
// @name         Open Recording Edit Links Only (Harmony Release Actions)
// @namespace    https://github.com/akeldama0435/musicbrainz_userscripts_repo/
// @version      1.2
// @author       Akeldama
// @description  Adds a button on the top right on Harmony Actions to open only recording edit links after the page renders dynamically.
// @match        https://harmony.pulsewidth.org.uk/release/actions*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createButton() {
        if (document.getElementById('open-recordings-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'open-recordings-btn';
        btn.innerText = 'Open Recording Edit Links';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '9999',
            padding: '8px 14px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        });

        btn.addEventListener('click', openRecordingEditLinks);

        document.body.appendChild(btn);
    }

    function openRecordingEditLinks() {
        const links = [...document.querySelectorAll('a[href*="musicbrainz.org/recording/"]')]
            .filter(link => link.href.includes('/recording/') && link.href.includes('/edit'));

        if (!links.length) {
            alert('No recording edit links found.');
            return;
        }

        links.forEach(link => {
            window.open(link.href, '_blank');
        });
    }

    function observeForLinkContainer() {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelector('a[href*="musicbrainz.org/recording/"][href*="/edit"]')) {
                createButton();
                obs.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeForLinkContainer);
    } else {
        observeForLinkContainer();
    }
})();
