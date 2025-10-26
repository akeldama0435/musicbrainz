// ==UserScript==
// @name         Scroll to Bottom Button Top Center
// @namespace    https://musicbrainz.org/
// @version      0.1
// @description  Adds a fixed top-center button on MusicBrainz recording pages to scroll smoothly to the bottom of the page.
// @author       You
// @match        https://musicbrainz.org/recording/*/edit*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function addScrollButtonTopCenter() {
        if (document.querySelector('#scroll-to-bottom-btn')) return;

        const button = document.createElement('button');
        button.id = 'scroll-to-bottom-btn';
        button.textContent = '↓ Scroll to Bottom';
        button.title = 'Scroll to bottom of page';

        Object.assign(button.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2147483647',
            padding: '8px 14px',
            backgroundColor: '#6d1c9e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        });

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#55117c';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#6d1c9e';
        });

        button.addEventListener('click', () => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });

        document.body.appendChild(button);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addScrollButtonTopCenter);
    } else {
        addScrollButtonTopCenter();
    }

    new MutationObserver(() => {
        if (!document.querySelector('#scroll-to-bottom-btn')) addScrollButtonTopCenter();
    }).observe(document.body, { childList: true, subtree: true });
})();
