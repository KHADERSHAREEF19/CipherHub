         document.addEventListener('DOMContentLoaded', () => {
            // --- Theme Toggling (remains the same) ---
            const themeToggle = document.getElementById('theme-toggle');
            const lightIcon = document.getElementById('theme-icon-light');
            const darkIcon = document.getElementById('theme-icon-dark');
            const applyTheme = (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
                if (theme === 'light') {
                    lightIcon.classList.remove('hidden');
                    darkIcon.classList.add('hidden');
                } else {
                    lightIcon.classList.add('hidden');
                    darkIcon.classList.remove('hidden');
                }
            };
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

            // --- Page Navigation (UPDATED) ---
            const navLinks = document.querySelectorAll('.nav-link, .go-to-dashboard');
            const pages = document.querySelectorAll('.page');
            const encryptedCountEl = document.getElementById('encrypted-count');
            const decryptedCountEl = document.getElementById('decrypted-count');

            let stats = { encrypted: parseInt(localStorage.getItem('encryptedCount') || '0'), decrypted: parseInt(localStorage.getItem('decryptedCount') || '0') };
            function updateStatDisplay() { if(encryptedCountEl) encryptedCountEl.textContent = stats.encrypted; if(decryptedCountEl) decryptedCountEl.textContent = stats.decrypted; }
            function incrementStat(type) { stats[type]++; localStorage.setItem(`${type}Count`, stats[type]); updateStatDisplay(); }
            
            function showPage(targetId) {
                pages.forEach(page => page.classList.toggle('hidden', page.id !== targetId));
                document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.hash === `#${targetId.replace('page-','')}`));
                window.location.hash = targetId.replace('page-','');
                if (targetId === 'page-stats') updateStatDisplay();
            }
            
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = `page-${link.hash.substring(1)}`;
                    showPage(targetId);
                });
            });

            const initialHash = window.location.hash.substring(1);
            // Default to 'home' page
            showPage(`page-${initialHash || 'home'}`);


            // --- Core App Logic (Dashboard, remains the same) ---
            const encryptTabBtn = document.getElementById('encrypt-tab-btn');
            const decryptTabBtn = document.getElementById('decrypt-tab-btn');
            const encryptView = document.getElementById('encrypt-view');
            const decryptView = document.getElementById('decrypt-view');
            const statusArea = document.getElementById('status-area');
            const aiModal = document.getElementById('ai-modal');
            const closeAiModalBtn = document.getElementById('close-ai-modal');
            const aiExplanation = document.getElementById('ai-explanation');

            const encryptFileInput = document.getElementById('encrypt-file-input-real');
            const encryptDropArea = document.getElementById('encrypt-drop-area');
            const encryptBtn = document.getElementById('encrypt-btn');
            let encryptFile = null;

            const encryptFilePreview = document.getElementById('encrypt-file-preview');
            const encryptPreviewName = document.getElementById('encrypt-preview-name');
            const encryptPreviewSize = document.getElementById('encrypt-preview-size');
            const removeEncryptFileBtn = document.getElementById('remove-encrypt-file');

            const decryptFileInput = document.getElementById('decrypt-file-input-real');
            const decryptDropArea = document.getElementById('decrypt-drop-area');
            const keyInput = document.getElementById('key-input');
            const decryptBtn = document.getElementById('decrypt-btn');
            let decryptFile = null;

            const decryptFilePreview = document.getElementById('decrypt-file-preview');
            const decryptPreviewName = document.getElementById('decrypt-preview-name');
            const decryptPreviewSize = document.getElementById('decrypt-preview-size');
            const removeDecryptFileBtn = document.getElementById('remove-decrypt-file');
            
            function updateButtonState() {
                if (encryptBtn) encryptBtn.disabled = !encryptFile;
                if (decryptBtn) decryptBtn.disabled = !decryptFile || keyInput.value.trim() === '';
            }
            
            if (encryptTabBtn) { // Only run this logic if on dashboard
                encryptTabBtn.addEventListener('click', () => {
                    encryptTabBtn.style.backgroundColor = 'var(--border-active)';
                    encryptTabBtn.style.color = 'var(--text-headings)';
                    decryptTabBtn.style.backgroundColor = 'transparent';
                    decryptTabBtn.style.color = 'var(--text-primary)';
                    encryptView.classList.remove('hidden');
                    decryptView.classList.add('hidden');
                    clearStatus();
                });

                decryptTabBtn.addEventListener('click', () => {
                    decryptTabBtn.style.backgroundColor = 'var(--border-active)';
                    decryptTabBtn.style.color = 'var(--text-headings)';
                    encryptTabBtn.style.backgroundColor = 'transparent';
                    encryptTabBtn.style.color = 'var(--text-primary)';
                    decryptView.classList.remove('hidden');
                    encryptView.classList.add('hidden');
                    clearStatus();
                });
                encryptTabBtn.click();
            }

            function openAiModal() { aiModal.classList.remove('hidden'); }
            function closeAiModal() { aiModal.classList.add('hidden'); }
            closeAiModalBtn.addEventListener('click', closeAiModal);
            aiModal.addEventListener('click', (e) => { if (e.target === aiModal) { closeAiModal(); } });
            
            function setupDragDrop(dropArea, fileInput, fileHandler) {
                if (!dropArea) return;
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false));
                ['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false));
                ['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false));
                dropArea.addEventListener('drop', (e) => {
                    const files = e.dataTransfer.files;
                    if (files.length > 0) { fileInput.files = files; fileHandler(files[0]); }
                }, false);
            }

            function formatBytes(bytes, d=2) { if (0 === bytes) return "0 Bytes"; const c = 0 > d ? 0 : d, e = Math.floor(Math.log(bytes) / Math.log(1024)); return parseFloat((bytes / Math.pow(1024, e)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB"][e] }
            function handleEncryptFileSelect(file) { if(file) { encryptFile = file; encryptDropArea.classList.add('hidden'); encryptFilePreview.classList.remove('hidden'); encryptPreviewName.textContent = file.name; encryptPreviewSize.textContent = formatBytes(file.size); updateButtonState(); } }
            function handleDecryptFileSelect(file) { if(file) { decryptFile = file; decryptDropArea.classList.add('hidden'); decryptFilePreview.classList.remove('hidden'); decryptPreviewName.textContent = file.name; decryptPreviewSize.textContent = formatBytes(file.size); updateButtonState(); } }

            if (encryptFileInput) encryptFileInput.addEventListener('change', (e) => handleEncryptFileSelect(e.target.files[0]));
            if (decryptFileInput) decryptFileInput.addEventListener('change', (e) => handleDecryptFileSelect(e.target.files[0]));
            if (keyInput) keyInput.addEventListener('input', updateButtonState);

            if (removeEncryptFileBtn) removeEncryptFileBtn.addEventListener('click', () => { encryptFile = null; encryptFileInput.value = ''; encryptFilePreview.classList.add('hidden'); encryptDropArea.classList.remove('hidden'); updateButtonState(); });
            if (removeDecryptFileBtn) removeDecryptFileBtn.addEventListener('click', () => { decryptFile = null; decryptFileInput.value = ''; decryptFilePreview.classList.add('hidden'); decryptDropArea.classList.remove('hidden'); updateButtonState(); });
            
            setupDragDrop(encryptDropArea, encryptFileInput, handleEncryptFileSelect);
            setupDragDrop(decryptDropArea, decryptFileInput, handleDecryptFileSelect);

            function showLoading(message) { if(statusArea) statusArea.innerHTML = `<div class="flex items-center justify-center space-x-2"><svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>${message}</span></div>`; }
            function showError(message) { if(statusArea) statusArea.innerHTML = `<div class="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg"><p class="font-bold">Error</p><p class="text-sm">${message}</p></div>`; }
            function clearStatus() { if(statusArea) statusArea.innerHTML = ''; }

            function showEncryptionSuccess(keyString) {
                if(!statusArea) return;
                statusArea.innerHTML = `<div class="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg space-y-4"><p class="font-bold text-lg">Encryption Successful!</p><p class="text-sm">Download your file and <strong class="text-yellow-300">save this key to decrypt it later.</strong></p><div><label class="font-medium block text-left">Your Encryption Key:</label><div class="relative mt-1"><textarea readonly rows="3" class="w-full border rounded-lg p-2 pr-10 key-display" style="background-color: var(--bg-input); border-color: var(--border-primary);">${keyString}</textarea><button id="copy-key-btn" class="absolute top-2 right-2 p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></div></div><a id="download-encrypted-link" class="btn block w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold text-white">Download Encrypted File</a><button id="ask-ai-btn" class="btn block w-full bg-gray-600 hover:bg-gray-700 p-3 rounded-lg text-sm text-white">✨ Ask AI: Why is this secure?</button></div>`;
                document.getElementById('copy-key-btn').addEventListener('click', () => { document.querySelector('.key-display').select(); document.execCommand('copy'); showNotification('Key copied!'); });
                document.getElementById('ask-ai-btn').addEventListener('click', getSecurityExplanation);
                incrementStat('encrypted');
            }

            function showDecryptionSuccess() {
                 if(!statusArea) return;
                 statusArea.innerHTML = `<div class="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg space-y-4"><p class="font-bold text-lg">Decryption Successful!</p><p class="text-sm">Your original file has been restored.</p><a id="download-decrypted-link" class="btn block w-full bg-emerald-600 hover:bg-emerald-700 p-3 rounded-lg font-semibold text-white">Download Decrypted File</a></div>`;
                 incrementStat('decrypted');
            }

            function showNotification(message) {
                const notif = document.createElement('div');
                notif.textContent = message;
                notif.className = 'fixed bottom-5 right-5 text-white p-3 rounded-lg shadow-lg fade-in z-50';
                notif.style.backgroundColor = 'var(--bg-card)';
                document.body.appendChild(notif);
                setTimeout(() => { notif.remove() }, 2500);
            }

            async function getSecurityExplanation() {
                openAiModal();
                aiExplanation.innerHTML = `<div class="flex items-center justify-center py-8"><svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Contacting AI...</span></div>`;
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const userQuery = "Explain simply for a non-technical person why AES-GCM encryption with a 256-bit key is very secure for protecting files. Be concise, reassuring, and use paragraphs.";
                try {
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: userQuery }] }] }) });
                    if (!response.ok) throw new Error(`API error: ${response.status}`);
                    const result = await response.json();
                    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) aiExplanation.innerHTML = `<div class="prose max-w-none">${text.split('\n').map(p => `<p>${p}</p>`).join('')}</div>`;
                    else throw new Error("Invalid AI response format.");
                } catch (error) {
                    aiExplanation.innerHTML = `<div class="bg-red-500/20 p-4 rounded-lg text-red-300"><p class="font-bold">Failed to get explanation.</p><p>${error.message}</p></div>`;
                }
            }
            
            const ALGO = 'AES-GCM';
            const IV_LENGTH = 12;
            async function generateKey() { return window.crypto.subtle.generateKey({ name: ALGO, length: 256 }, true, ['encrypt', 'decrypt']); }
            async function exportKey(key) { const jwk = await window.crypto.subtle.exportKey('jwk', key); return btoa(JSON.stringify(jwk)); }
            async function importKey(keyString) { try { const jwk = JSON.parse(atob(keyString)); return await window.crypto.subtle.importKey('jwk', jwk, { name: ALGO }, true, ['encrypt', 'decrypt']); } catch (e) { throw new Error("Invalid key format."); } }
            async function encryptData(file, key) { const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH)); const fileBuffer = await file.arrayBuffer(); const encryptedBuffer = await window.crypto.subtle.encrypt({ name: ALGO, iv: iv }, key, fileBuffer); const result = new Uint8Array(iv.length + encryptedBuffer.byteLength); result.set(iv, 0); result.set(new Uint8Array(encryptedBuffer), iv.length); return result.buffer; }
            async function decryptData(encryptedBuffer, key) { const iv = encryptedBuffer.slice(0, IV_LENGTH); const data = encryptedBuffer.slice(IV_LENGTH); return window.crypto.subtle.decrypt({ name: ALGO, iv: new Uint8Array(iv) }, key, data); }

            if (encryptBtn) encryptBtn.addEventListener('click', async () => { if (!encryptFile) return; showLoading("Encrypting file..."); try { const key = await generateKey(); const keyString = await exportKey(key); const encryptedData = await encryptData(encryptFile, key); showEncryptionSuccess(keyString); const blob = new Blob([encryptedData], { type: 'application/octet-stream' }); const url = URL.createObjectURL(blob); document.getElementById('download-encrypted-link').href = url; document.getElementById('download-encrypted-link').download = `${encryptFile.name}.encrypted`; } catch (e) { showError(e.message); } });
            if (decryptBtn) decryptBtn.addEventListener('click', async () => { if (!decryptFile || !keyInput.value) return; showLoading("Decrypting file..."); try { const key = await importKey(keyInput.value.trim()); const encryptedBuffer = await decryptFile.arrayBuffer(); const decryptedData = await decryptData(encryptedBuffer, key); showDecryptionSuccess(); const originalFileName = decryptFile.name.replace(/\.encrypted$/, ''); const blob = new Blob([decryptedData]); const url = URL.createObjectURL(blob); document.getElementById('download-decrypted-link').href = url; document.getElementById('download-decrypted-link').download = originalFileName; } catch (e) { showError("Decryption failed. Check key or file integrity."); } });
            
            // --- Contact Form Logic (NEW) ---
            const contactForm = document.getElementById('contact-form');
            const contactSubmitBtn = document.getElementById('contact-submit-btn');
            const contactStatus = document.getElementById('contact-status');
            if (contactForm) {
                contactForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const formData = new FormData(contactForm);
                    const object = Object.fromEntries(formData);
                    const json = JSON.stringify(object);
                    
                    contactStatus.innerHTML = 'Sending...';
                    contactSubmitBtn.disabled = true;

                    try {
                        const response = await fetch('https://api.web3forms.com/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: json
                        });
                        const result = await response.json();
                        if (result.success) {
                            contactStatus.innerHTML = '<p class="text-green-400">Message sent successfully!</p>';
                            contactForm.reset();
                        } else {
                            throw new Error(result.message || 'An error occurred.');
                        }
                    } catch (error) {
                        contactStatus.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
                    } finally {
                        contactSubmitBtn.disabled = false;
                        setTimeout(() => contactStatus.innerHTML = '', 4000);
                    }
                });
            }

            updateButtonState();
        });
