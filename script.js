// === ANA SİSTEM FONKSİYONLARI ===
const editor = document.getElementById('editor');
let encryptedDataPayload = null;
let countdownInterval = null;
let undoStack = [];
let redoStack = [];
let isTyping = false;
let statsTimeout = null;

// === ZAMAN GÖSTERİCİ ===
const updateClock = () => {
    document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('tr-TR');
};
setInterval(updateClock, 1000);
updateClock();

// === İSTATİSTİK GÜNCELLEME ===
const updateStats = () => {
    clearTimeout(statsTimeout);
    statsTimeout = setTimeout(() => {
        const text = editor.value;
        const charCount = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text ? text.split('\n').length : 0;

        document.getElementById('charCount').textContent = `Karakter: ${charCount}`;
        document.getElementById('wordCount').textContent = `Kelime: ${words}`;
        document.getElementById('lineCount').textContent = `Satır: ${lines}`;
        document.getElementById('wordCounter').textContent = `${charCount} karakter`;
        document.getElementById('wordCounterStatus').textContent = `${words} kelime`;
    }, 50);
};

// === GERİ AL / İLERİ AL ===
const saveState = () => {
    undoStack.push(editor.value);
    if (undoStack.length > 100) undoStack.shift();
    redoStack = [];
};

const undoText = () => {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        editor.value = undoStack[undoStack.length - 1];
        updateStats();
    }
};

const redoText = () => {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        editor.value = undoStack[undoStack.length - 1];
        updateStats();
    }
};

editor.addEventListener('input', () => {
    if (!isTyping) {
        saveState();
        isTyping = true;
    }
    clearTimeout(isTyping);
    setTimeout(() => { isTyping = false; }, 200);
});

// === DOSYA YÜKLEME ===
const loadFile = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            saveState();
            editor.value = evt.target.result;
            updateStats();
        };
        reader.readAsText(file);
    }
    e.target.value = '';
};

// === METİN BİÇİMLENDİRME ===
const formatText = (type) => {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selected = text.substring(start, end);

    if (selected) {
        const formats = {
            bold: `**${selected}**`,
            italic: `_${selected}_`,
            code: `\`${selected}\``,
            strike: `~~${selected}~~`
        };
        const formatted = formats[type];
        if (formatted) {
            saveState();
            editor.value = text.substring(0, start) + formatted + text.substring(end);
            editor.selectionStart = start;
            editor.selectionEnd = start + formatted.length;
            updateStats();
        }
    }
};

// === METİN DÖNÜŞTÜRME ===
const transformText = (type) => {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selected = text.substring(start, end);

    if (selected) {
        const transforms = {
            uppercase: selected.toUpperCase(),
            lowercase: selected.toLowerCase(),
            capitalize: selected.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        };
        const transformed = transforms[type];
        if (transformed) {
            saveState();
            editor.value = text.substring(0, start) + transformed + text.substring(end);
            editor.selectionStart = start;
            editor.selectionEnd = start + transformed.length;
            updateStats();
        }
    }
};

// === TEMİZLEME ===
const trimText = () => {
    saveState();
    editor.value = editor.value.trim();
    updateStats();
};

const removeExtraSpaces = () => {
    saveState();
    editor.value = editor.value.replace(/[ ]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');
    updateStats();
};

// === TAM EKRAN ===
const toggleFullscreen = () => {
    const container = document.querySelector('.app-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
};

// === DOSYA İNDİRME ===
const exportText = () => {
    const text = editor.value;
    if (!text.trim()) return alert('İndirilecek metin yok!');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `turhan_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
};

// === KISA LİNK OLUŞTUR ===
const generateShareLink = () => {
    const text = editor.value;
    if (!text.trim()) {
        alert('Lütfen bir metin yazın veya dosya yükleyin!');
        return;
    }

    saveState();

    const password = document.getElementById('linkPassword').value;
    const durationSeconds = parseInt(document.getElementById('linkExpiry').value);

    if (typeof createShortLink === 'function') {
        const shortUrl = createShortLink(text, password, durationSeconds);
        
        const shareInput = document.getElementById('shareUrl');
        if (shareInput) {
            shareInput.value = shortUrl;
            document.getElementById('shareBox').style.display = 'block';
        }

        setTimeout(() => {
            navigator.clipboard.writeText(shortUrl).catch(() => {});
        }, 50);
    } else {
        alert('Kısa link sistemi yüklenemedi! Lütfen short.js dosyasını kontrol edin.');
    }
};

// === PAYLAŞIM ===
const shareViaSocial = () => {
    const url = document.getElementById('shareUrl').value;
    if (navigator.share) {
        navigator.share({
            title: 'Turhan TV HD Paylaşımı',
            text: 'Turhan TV HD ile oluşturduğum içeriğe göz at!',
            url: url
        }).catch(() => {});
    } else {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Turhan TV HD ile oluşturduğum içeriğe göz at!`, '_blank');
    }
};

const copyLink = () => {
    const copyText = document.getElementById('shareUrl');
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert('Link kopyalandı!');
};

// === İÇERİK KOPYALA ===
const copyContent = () => {
    const content = document.getElementById('textContent');
    if (content) {
        navigator.clipboard.writeText(content.textContent);
    }
};

const exportViewContent = () => {
    const content = document.getElementById('textContent');
    if (!content) return;
    const text = content.textContent;
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `turhan_view_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
};

// === TEMİZLEME ===
const clearEditor = () => {
    if (confirm('Tüm metni silmek istediğinize emin misiniz?')) {
        saveState();
        editor.value = '';
        updateStats();
        document.getElementById('shareBox').style.display = 'none';
    }
};

// === TEMA DEĞİŞTİR ===
const toggleTheme = () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('turhan_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};

// Tema yükle
if (localStorage.getItem('turhan_theme') === 'light') {
    document.body.classList.add('light-mode');
}

// === KLAVYE KISAYOLLARI ===
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey)) {
        switch(e.key) {
            case 'z':
                e.preventDefault();
                e.shiftKey ? redoText() : undoText();
                break;
            case 's':
                e.preventDefault();
                generateShareLink();
                break;
            case 'f':
                e.preventDefault();
                document.querySelector('.app-container').requestFullscreen?.();
                break;
        }
    }
});

// === LİNK KONTROL ===
window.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('s');
    
    if (code && typeof getLinkData === 'function') {
        const data = getLinkData(code);
        if (data) {
            data.clicks = (data.clicks || 0) + 1;
            localStorage.setItem('turhan_short_links', JSON.stringify(linkDB));
            
            try {
                const jsonString = decodeURIComponent(escape(atob(data.data)));
                const payload = JSON.parse(jsonString);
                
                document.getElementById('editorSection').style.display = 'none';
                
                if (payload.d > 0) {
                    const expiresAt = payload.t + payload.d;
                    startCountdown(expiresAt);
                }
                
                if (payload.e === 1) {
                    encryptedDataPayload = payload.c;
                    document.getElementById('textContent').innerHTML = `
                        <div style="text-align:center; padding:20px;">
                            <i class="fa-solid fa-shield-halved" style="font-size:3rem; color:var(--accent); margin-bottom:16px;"></i>
                            <h3>Bu İçerik Parola İle Korunuyor</h3>
                            <p style="color:var(--text-muted); margin-bottom:20px;">Lütfen erişim parolasını girin.</p>
                            <div style="max-width:360px; margin:0 auto; display:flex; gap:10px;">
                                <input type="password" id="inputDecryptPassword" placeholder="Parola" style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--panel-border); background:var(--input-bg); color:var(--text-main); outline:none;">
                                <button class="btn" onclick="unlockContent()"><i class="fa-solid fa-unlock"></i> Aç</button>
                            </div>
                            <div id="decryptedContent" style="margin-top:15px; background:var(--input-bg); border-radius:12px; padding:20px; border:1px solid var(--panel-border); font-family:'Fira Code',monospace; white-space:pre-wrap; word-break:break-word; display:none;"></div>
                        </div>
                    `;
                    document.getElementById('viewSection').style.display = 'block';
                } else {
                    showContent(payload.c);
                }
            } catch(e) {
                alert('Geçersiz link!');
            }
        } else {
            document.getElementById('editorSection').style.display = 'none';
            document.getElementById('expiredSection').style.display = 'block';
        }
    }
});

// === SÜRE SAYACI ===
function startCountdown(expiresAt) {
    const timerBadge = document.getElementById('timerDisplay');
    if (!timerBadge) return;
    timerBadge.style.display = 'inline-flex';
    
    const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000);
        const diff = expiresAt - now;
        
        if (diff <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('viewSection').style.display = 'none';
            document.getElementById('expiredSection').style.display = 'block';
            return;
        }
        
        const days = Math.floor(diff / (24 * 3600));
        const hours = Math.floor((diff % (24 * 3600)) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        let timeStr = "";
        if (days > 0) timeStr += `${days}g `;
        if (hours > 0 || days > 0) timeStr += `${hours}sa `;
        timeStr += `${minutes}dk ${seconds < 10 ? '0' : ''}${seconds}sn`;
        
        timerBadge.innerHTML = `<i class="fa-solid fa-stopwatch"></i> Kalan Süre: ${timeStr}`;
        timerBadge.classList.toggle('urgent', diff < 300);
    };
    
    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

// === ŞİFRE ÇÖZME ===
function unlockContent() {
    const pass = document.getElementById('inputDecryptPassword').value;
    if (!pass) return alert('Lütfen parolayı girin.');
    
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedDataPayload, pass);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedText) return alert('Hatalı parola!');
        
        const el = document.getElementById('decryptedContent');
        if (el) {
            el.textContent = decryptedText;
            el.style.display = 'block';
        }
    } catch(e) {
        alert('Hatalı parola!');
    }
}

// === İÇERİK GÖSTERME ===
function showContent(text) {
    document.getElementById('viewSection').style.display = 'block';
    document.getElementById('textContent').textContent = text;
    
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;

    document.getElementById('charCount').textContent = `Karakter: ${charCount}`;
    document.getElementById('wordCount').textContent = `Kelime: ${words}`;
    document.getElementById('lineCount').textContent = `Satır: ${lines}`;
    document.getElementById('wordCounterStatus').textContent = `${words} kelime`;
}

// İlk state
setTimeout(saveState, 50);
