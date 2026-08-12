// ============================================================
// === KENDİ KISA LINK SİSTEMİ ===
// ============================================================
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Veritabanı (LocalStorage)
let linkDB = JSON.parse(localStorage.getItem('turhan_short_links') || '{}');
let counter = parseInt(localStorage.getItem('turhan_link_counter') || '0');

// Base62 encode
function encodeBase62(num) {
    if (num === 0) return '0';
    let encoded = '';
    while (num > 0) {
        encoded = BASE62[num % 62] + encoded;
        num = Math.floor(num / 62);
    }
    return encoded;
}

// 8 karakterlik benzersiz kod oluştur
function generateShortCode() {
    counter++;
    localStorage.setItem('turhan_link_counter', String(counter));
    
    const timestamp = Date.now().toString(36);
    const count = encodeBase62(counter);
    const random = Math.random().toString(36).substring(2, 5);
    
    let code = '';
    const combined = timestamp + count + random;
    for (let i = 0; i < combined.length && i < 8; i++) {
        const charCode = combined.charCodeAt(i);
        code += BASE62[charCode % 62];
    }
    return code.padStart(8, '0');
}

// Kısa link oluştur
function createShortLink(text, password, duration) {
    const createdAt = Math.floor(Date.now() / 1000);
    let content = text;
    let encrypted = 0;
    
    if (password) {
        content = CryptoJS.AES.encrypt(text, password).toString();
        encrypted = 1;
    }
    
    const payload = {
        c: content,
        e: encrypted,
        t: createdAt,
        d: duration
    };
    
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    
    let code = generateShortCode();
    while (linkDB[code]) {
        code = generateShortCode();
    }
    
    linkDB[code] = {
        data: encoded,
        created: createdAt,
        duration: duration,
        clicks: 0,
        active: true
    };
    
    localStorage.setItem('turhan_short_links', JSON.stringify(linkDB));
    
    // Link'i oluştur
    const baseUrl = window.location.origin + window.location.pathname;
    return baseUrl + '?s=' + code;
}

// Link verisini al - DÜZELTİLDİ
function getLinkData(code) {
    const data = linkDB[code];
    if (!data) {
        console.log('Link bulunamadı:', code);
        return null;
    }
    
    console.log('Link verisi:', data);
    console.log('Şu anki zaman:', Math.floor(Date.now() / 1000));
    console.log('Oluşturulma:', data.created);
    console.log('Süre:', data.duration);
    console.log('Bitiş:', data.created + data.duration);
    
    // Süre kontrolü - DÜZELTİLDİ
    if (data.duration > 0) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = data.created + data.duration;
        
        if (now > expiresAt) {
            data.active = false;
            localStorage.setItem('turhan_short_links', JSON.stringify(linkDB));
            console.log('LİNK SÜRESİ DOLMUŞ!');
            return null;
        }
        console.log('Link geçerli, kalan süre:', expiresAt - now, 'saniye');
    } else {
        console.log('Süresiz link');
    }
    
    return data;
}
