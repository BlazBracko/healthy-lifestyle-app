# Step-by-Step Setup Guide - Healthy Lifestyle App

Ta vodič vodi skozi celoten proces kloniranja in zaganjanja backend-a in web frontend-a lokalno.

**Želiš naložiti spremembe na GitHub?** Preveri [UPLOAD_progress.md](./UPLOAD_progress.md) za navodila.

---

## 📋 Predpogoji

Preden začneš, preveri, da imaš nameščeno:

- **Node.js** (v16 ali višja) - [Prenesi tukaj](https://nodejs.org/)
- **npm** (pride z Node.js) ali **yarn**
- **Git** - [Prenesi tukaj](https://git-scm.com/)

---

## 🔽 Korak 1: Kloniranje projekta iz GitHub-a

### 1.1 Odpri terminal/command prompt

### 1.2 Navigiraj v mapo, kjer želiš shraniti projekt

**Na macOS/Linux:**
```bash
cd ~/Documents  # ali katera koli druga mapa
```

**Na Windows:**
```bash
cd C:\Users\TvojeIme\Documents  # ali katera koli druga mapa
```

### 1.3 Kloniraj repozitorij
```bash
git clone https://github.com/BlazBracko/healthy-lifestyle-app.git
```

### 1.4 Navigiraj v projekt
```bash
cd healthy-lifestyle-app
```

### 1.5 Preveri, da si na main branchu (to obvezno)
```bash
git branch
# Output: * main

# Če nisi na main:
git checkout main
git pull
```

---

## 🔧 Korak 2: Nastavitev Backend-a

### 2.1 Navigiraj v backend mapo
```bash
cd backend
```

### 2.2 Namesti odvisnosti
```bash
npm install
```

> **Opomba**: To lahko traja nekaj minut, ker se namešča veliko paketov.

### 2.3 Zaženi backend server

**Za razvoj (z auto-reload):**
```bash
npm run dev
```

### 2.4 Preveri, da backend deluje

Odpri brskalnik in pojdi na:
```
http://localhost:3001
```

Morali bi videti: `"Hello World!"`

Ali preveri v terminalu:
```
Server is running on port: 3001
MongoDB connected successfully
```

> ✅ **Backend je sedaj pripravljen!** Pusti terminal odprt.

---

## 🌐 Korak 3: Nastavitev Web Frontend-a

### 3.1 Odpri nov terminal/command prompt

> **Pomembno**: Pusti backend terminal odprt in odpri nov terminal za frontend!

### 3.2 Navigiraj v web mapo
```bash
cd web
# Če si v root projektu:
cd ~/Documents/healthy-lifestyle-app/web
```

### 3.3 Namesti odvisnosti
```bash
npm install
```

### 3.4 Zaženi web aplikacijo
```bash
npm start
```

### 3.5 Preveri, da web deluje

Brskalnik bi se moral sam odpreti na:
```
http://localhost:3000
```

Če se ne, odpri ročno in pojdi na `http://localhost:3000`

> ✅ **Web frontend je sedaj pripravljen!**

---

## 🚀 Hitri zagon - Vse naenkrat

Če želiš zagnati obe komponenti hkrati, odpri **2 ločene terminale**:

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Web:
```bash
cd web
npm start
```

---

## ✅ Uspešno!

Če si sledil vsem korakom, bi moral imeti:
- ✅ Backend teče na `http://localhost:3001`
- ✅ Web app teče na `http://localhost:3000`

**Veselo kodiranje! 🎉**
