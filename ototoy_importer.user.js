// ==UserScript==
// @name         Import Ototoy Releases to MusicBrainz
// @namespace    https://github.com/akeldama0435/musicbrainz_userscripts_repo
// @version      0.4
// @description  Adds a button on Ototoy album pages to pre-fill a MusicBrainz release form using POST, including automatic artist MBID lookup and MB icon
// @updateURL    https://github.com/akeldama0435/musicbrainz/blob/main/ototoy_importer.user.js
// @downloadURL  https://github.com/akeldama0435/musicbrainz/blob/main/ototoy_importer.user.js
// @author       Akeldama
// @aiassisted
// @icon         https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/MusicBrainz_Logo_Icon_%282016%29.svg/45px-MusicBrainz_Logo_Icon_%282016%29.svg.png?20210414232158
// @match        https://ototoy.jp/_/default/p/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function waitForElement(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            if (timeout) {
                setTimeout(() => {
                    observer.disconnect();
                    reject(`Timeout waiting for selector: ${selector}`);
                }, timeout);
            }
        });
    }

    async function fetchArtistMBID(artistName) {
        try {
            const url = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artistName)}&fmt=json`;
            const response = await fetch(url, { headers: { 'User-Agent': 'Ototoy-MB-Importer/1.0 ( your-email@example.com )' } });
            const data = await response.json();
            if (data.artists && data.artists.length > 0) {
                return data.artists[0].id; // Take first match
            }
        } catch (err) {
            console.error('Error fetching MBID:', err);
        }
        return null;
    }

    async function init() {
        try {
            // Wait for album title
            const titleEl = await waitForElement('.album-title');
            const title = titleEl.textContent.trim();

            // Extract artist
            const artistEl = document.querySelector('span.album-artist > a:nth-child(1)');
            const artist = artistEl ? artistEl.textContent.trim() : 'Unknown Artist';

            // Insert MusicBrainz icon next to artist
            if (artistEl) {
                const mbIconLink = document.createElement('a');
                mbIconLink.href = '#'; // temporary
                mbIconLink.target = '_blank';
                mbIconLink.style.marginLeft = '5px';
                const mbIconImg = document.createElement('img');
                mbIconImg.src = 'https://musicbrainz.org/static/images/favicons/android-chrome-192x192.png';
                mbIconImg.alt = 'MusicBrainz';
                mbIconImg.style.width = '16px';
                mbIconImg.style.height = '16px';
                mbIconImg.style.verticalAlign = 'middle';
                mbIconLink.appendChild(mbIconImg);
                artistEl.parentNode.insertBefore(mbIconLink, artistEl.nextSibling);

                // Fetch MBID to update link
                const mbid = await fetchArtistMBID(artist);
                if (mbid) {
                    mbIconLink.href = `https://musicbrainz.org/artist/${mbid}`;
                } else {
                    mbIconLink.title = 'MusicBrainz ID not found';
                    mbIconLink.style.opacity = '0.5';
                }
            }

            // Extract label
            const labelEl = document.querySelector('.label-name > a:nth-child(1)');
            const label = labelEl ? labelEl.textContent.trim() : '';

            // Extract release date
            const releaseDateEl = document.querySelector('.release-day');
            let day = '', month = '', year = '';
            if (releaseDateEl) {
                const dateStr = releaseDateEl.textContent.trim(); // e.g., "2025-10-26" or "2025年10月26日"
                const nums = dateStr.match(/\d+/g); // extract all numbers
                if (nums && nums.length >= 3) {
                    year = parseInt(nums[0], 10);
                    month = parseInt(nums[1], 10);
                    day = parseInt(nums[2], 10);
                }
            }

            // Extract tracks and lengths
            const trackRows = document.querySelectorAll('#tracklist > tbody > tr');
            const tracks = [];
            trackRows.forEach((tr, idx) => {
                const trackTitleEl = tr.querySelector(`td.item > span[id^="title-"]`);
                const trackTitle = trackTitleEl ? trackTitleEl.textContent.trim() : '';
                const trackLengthEl = tr.querySelector('td:nth-child(4)');
                const trackLengthStr = trackLengthEl ? trackLengthEl.textContent.trim() : '';
                let trackLengthMs = null;
                if (trackLengthStr) {
                    const parts = trackLengthStr.split(':').map(p => parseInt(p, 10));
                    if (parts.length === 2) {
                        trackLengthMs = (parts[0]*60 + parts[1]) * 1000;
                    } else if (parts.length === 3) {
                        trackLengthMs = (parts[0]*3600 + parts[1]*60 + parts[2]) * 1000;
                    }
                }
                if (trackTitle) {
                    tracks.push({title: trackTitle, length: trackLengthMs});
                }
            });

            // Insert MusicBrainz button
            const btn = document.createElement('button');
            btn.textContent = 'Add to MusicBrainz';
            btn.style.margin = '10px';
            btn.style.padding = '5px 10px';
            btn.style.fontSize = '14px';
            btn.style.cursor = 'pointer';
            titleEl.parentNode.insertBefore(btn, titleEl.nextSibling);

            btn.addEventListener('click', async () => {
                const mbid = await fetchArtistMBID(artist);

                // Build form
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://musicbrainz.org/release/add';
                form.target = '_blank';

                const addInput = (name, value) => {
                    if (value !== null && value !== undefined && value !== '') {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = name;
                        input.value = value;
                        form.appendChild(input);
                    }
                };

                addInput('name', title);
                addInput('artist_credit.names.0.name', artist);
                addInput('artist_credit.names.0.artist.name', artist);
                if (mbid) addInput('artist_credit.names.0.mbid', mbid);
                if (label) addInput('labels.0.name', label);
                addInput('date.year', year);
                addInput('date.month', month);
                addInput('date.day', day);
                addInput('country', 'XW');
                addInput('status', 'official');
                addInput('language', 'eng');
                addInput('script', 'latn');
                addInput('packaging', 'None');
                addInput('edit_note', `Imported from ${window.location.href}`);
                addInput('urls.0.url', window.location.href);
                addInput('urls.0.type', 79);
                addInput('mediums.0.format', 'Digital Media');

                tracks.forEach((track, idx) => {
                    addInput(`mediums.0.track.${idx}.name`, track.title);
                    addInput(`mediums.0.track.${idx}.artist_credit.names.0.name`, artist);
                    addInput(`mediums.0.track.${idx}.artist_credit.names.0.artist.name`, artist);
                    if (mbid) addInput(`mediums.0.track.${idx}.artist_credit.names.0.mbid`, mbid);
                    if (track.length !== null) addInput(`mediums.0.track.${idx}.length`, track.length);
                });

                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
            });

        } catch (err) {
            console.error('Error setting up Ototoy → MB importer:', err);
        }
    }

    init();
})();
