# Notes Studio 1.0 — Installable PWA

Ye folder ek complete, installable Progressive Web App hai. Bas ise kisi **HTTPS** URL par host karo — phone uske baad "Install app" offer karega.

---

## Files

```
pwa/
├── notes-studio-1.0v.html   ← app (sab kuch isi ke andar hai)
├── manifest.json            ← naam, icons, shortcuts, file handlers
├── sw.js                    ← service worker (offline caching + updates)
├── offline.html             ← fallback page jab pehli baar offline ho
├── icons/
│   ├── icon-192.png · icon-512.png          (normal)
│   ├── maskable-192.png · maskable-512.png  (Android adaptive)
│   ├── apple-touch-icon.png                  (iOS home screen)
│   ├── favicon-64.png
│   └── icon.svg
└── README.md
```

**Zaroori:** `manifest.json`, `sw.js`, `icons/` folder aur HTML — chaaron ek hi folder mein, same level par rehne chahiye.

---

## Host kaise karein (koi bhi ek)

### Option A — Netlify Drop (sabse aasan, 1 minute)
1. https://app.netlify.com/drop kholo
2. `pwa` **folder** ko drag-and-drop karo
3. Jo URL mile (jaise `https://notes-studio-xyz.netlify.app`), wo phone par kholo → **Install** offer aayega

### Option B — GitHub Pages (free, permanent)
1. GitHub par naya repo banao, `pwa` folder ka content upload karo (root mein `notes-studio-1.0v.html` hona chahiye)
2. Settings → Pages → Branch: `main` / folder: `/ (root)` → Save
3. 1-2 minute baad `https://<username>.github.io/<repo>/notes-studio-1.0v.html`

### Option C — Vercel / Cloudflare Pages
Same tarika: folder upload karo, framework "Other / None" chuno.

### Option D — Apne computer se test karna
```bash
cd pwa
python3 -m http.server 8080
# phone: http://<computer-ka-IP>:8080/notes-studio-1.0v.html
```
⚠️ `http://` par sirf **localhost** install hota hai. LAN IP par install ke liye HTTPS chahiye (ya ngrok use karo: `ngrok http 8080`).

> **file:// se kholne par install nahi hota** — browser ka rule hai (service worker ke liye HTTPS/localhost zaroori). File waise bhi pura chalega, bas install nahi milega.

---

## Install kaise karein

| Device | Tarika |
|---|---|
| **Android (Chrome / Edge)** | App kholo → menu (⋮) → **Install app** · ya Notes Studio ke menu → **Install app** · ya address bar mein install icon |
| **iPhone / iPad (Safari)** | Share button → **Add to Home Screen** (app ke menu mein bhi guide milti hai) |
| **Desktop Chrome / Edge** | Address bar ke right mein install icon, ya ⋮ → Install |
| **Desktop Safari (macOS 14+)** | File → Add to Dock |

Install hone ke baad: apna icon, full screen (koi browser bar nahi), aur **poora offline**.

---

## Install ke baad kya milta hai

- **Home screen shortcut** — long-press par 3 shortcuts: **New note**, **Templates**, **Latest note**
- **Fully offline** — pehli load ke baad app + KaTeX + marked + DOMPurify + Mermaid sab cache se aate hain (maine network band karke test kiya)
- **Share se note** — Android share sheet se text Notes Studio ko bhejo → naya note ban jata hai
- **File open** — `.md`, `.txt`, `.svg`, `.json` file ko "Open with Notes Studio" se kholo (Android Chrome; support device par depend karta hai)
- **Auto update** — naya version aane par app khud check karti hai aur "New version ready → **Reload**" toast dikhati hai. Reload dabane se pehle aapka kaam safe rehta hai.

---

## Update kaise karein (jab aap app badlo)

1. `notes-studio-1.0v.html` ko naye version se replace karo
2. `sw.js` mein pehli line badlo:
   ```js
   const VERSION = '1.0.1';   →   const VERSION = '1.0.2';
   ```
   (ye zaroori hai — warna purana cache serve hota rahega)
3. Deploy karo → users ko agli baar app kholne par "New version ready" dikhega

---

## Testing / cache reset

| Kaam | Chrome |
|---|---|
| Service worker dekho | DevTools → Application → Service Workers |
| Cache dekho / clear karo | DevTools → Application → Cache Storage |
| Installability check | DevTools → Application → Manifest (koi error nahi hona chahiye) |
| Hard reset | DevTools → Application → Storage → Clear site data |

App ke andar: menu → **Settings** → *Delete all notes* (data) ya **Backup (.json)** se pehle backup le lo.

---

## Aapke data ka kya

- Notes **device par** (localStorage) rehte hain — koi server, koi account nahi
- Browser data clear karne se notes delete ho jayenge → **menu → Backup all notes (.json)** regular lo
- Backup file ko wapas laane ke liye: menu → **Import** → usi `.json` ko chuno

---

## Verified (Chrome, automated)

```
Manifest errors: 0      · Installability errors: 0 (Chrome ka verdict)
Service worker: active  · Page controlled: yes
Shell cache: app + manifest + offline page + 6 icons
Libs cache: KaTeX, marked, DOMPurify, Mermaid
Offline reload (network killed): app boots, math + diagrams render
Shortcuts: ?action=new ✓  ?action=templates ✓  ?action=last ✓
Share target: shared text → new note ✓
Update flow: toast "New version ready" → Reload → old cache cleaned, new cache active ✓
Console errors (online): 0
```
