// ==UserScript==
// @name         Add Harmony Link Button to MusicBrainz Release
// @namespace    https://github.com/akeldama0435/musicbrainz_userscripts_repo
// @version      0.3
// @description  Adds a centered-ish Harmony button near the tracklist heading, but only for Digital Media releases. 
// @updateURL    https://github.com/akeldama0435/musicbrainz/blob/main/harmony_button.user.js
// @downloadURL  https://github.com/akeldama0435/musicbrainz/blob/main/harmony_button.user.js
// @author       Akeldama
// @icon         https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/MusicBrainz_Logo_Icon_%282016%29.svg/45px-MusicBrainz_Logo_Icon_%282016%29.svg.png?20210414232158
// @match        *://*/*
// @exclude      https://www.discogs.com/*
// @exclude      https://musicbrainz.org/release/*/edit
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const selectors = [
    { s: 'meta[property="music:album"]' },
    { s: 'meta[property="music:album:url"]' },
    { s: 'meta[name="music:album"]' },
    { s: 'meta[property="og:url"]', t: 'meta[property="og:type"][content="music.album"]' }
  ];

  const getAlbumURL = () => {
    for (const selector of selectors) {
      const meta = document.querySelector(selector.s);
      if (meta && meta.content) {
        if (selector.t) {
          const testMeta = document.querySelector(selector.t);
          if (!testMeta) continue;
        }
        return meta.content;
      }
    }
    return null;
  };

  const isDigitalMedia = () => {
    const textContent = document.body.textContent || '';
    return /digital\s*media/i.test(textContent);
  };

  const addButtonNearTracklist = () => {
    if (!isDigitalMedia()) return; // Only proceed if it's a Digital Media release

    const tracklistRegex = /^tracklist$/i;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let target = null;

    for (const heading of headings) {
      if (tracklistRegex.test(heading.textContent.trim())) {
        target = heading;
        break;
      }
    }

    if (!target) return;

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'flex-start'; // Change to 'center' to fully center
    container.style.gap = '12px';
    container.style.margin = '1em 0';

    const headingClone = target.cloneNode(true);

    const button = document.createElement('button');
    button.textContent = '🎵 Open in Harmony';
    button.style.padding = '6px 12px';
    button.style.fontSize = '0.9em';
    button.style.cursor = 'pointer';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '4px';
    button.style.background = '#f0f0f0';

    button.addEventListener('click', () => {
      const albumUrl = getAlbumURL() || location.href;
      const harmonyUrl = new URL('https://harmony.pulsewidth.org.uk/release');
      harmonyUrl.searchParams.set('url', albumUrl);
      harmonyUrl.searchParams.set('category', 'preferred');
      window.open(harmonyUrl.toString(), '_blank');
    });

    target.replaceWith(container);
    container.appendChild(headingClone);
    container.appendChild(button);
  };

  window.addEventListener('load', () => {
    addButtonNearTracklist();
  });

})();
