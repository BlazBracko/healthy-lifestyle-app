# Navodila za nalaganje sprememb na GitHub

Ta vodič vodi skozi celoten proces nalaganja sprememb na GitHub, z poudarkom na tem, da moraš biti na pravem branchu.

---

## ⚠️ POMEMBNO: Vedno preveri, na katerem branchu si!

**NIKOLI ne delaj sprememb direktno na `main` branchu!** Vedno ustvari nov branch za svoje spremembe.

---

## 📋 Korak 1: Preveri trenutni status

### 1.1 Preveri, na katerem branchu si
```bash
git branch
```

**Output:**
```
* main
  feature-branch
```

Zvezdica (*) označuje trenutni branch.

### 1.2 Preveri status sprememb
```bash
git status
```

**Želeni output pred začetkom dela:**
```
On branch main. Your branch is up to date with 'origin/main'.
```

> ⚠️ **Warning**: Status mora biti vedno pred začetkom novega taska "Up to date".

---

## 🌿 Korak 2: Ustvari nov branch (OBVEZNO!)

### 2.1 Preveri, da si na main branchu
```bash
git checkout main
git pull  # Povleci najnovejše spremembe
```

### 2.2 Ustvari nov branch

**Format imena brancha:** `ISSUE-KEY` (npr. `PM-1`, `TASK-123`)

```bash
git checkout -b PM-1
```

**Output:**
```
Switched to a new branch 'PM-1'
```

> ⚠️ **Warning**: Ime brancha mora biti ime tvoje taska oz. JIRA issue key.

**Kje najti JIRA issue key:**
- V JIRA sistemu, kjer je tvoj task
- Primer: `PM-1`, `TASK-123`, `BUG-45`

### 2.3 Preveri, da si na pravem branchu
```bash
git branch
```

**Output:**
```
* PM-1
  main
```

> ⚠️ **Warning**: Redno preverjaj, da si na svojem branchu. Nikoli nič ne delaj na main branchu!

---

## ✏️ Korak 3: Naredi spremembe

Sedaj lahko delaš spremembe v kodi. Ko si končal:

### 3.1 Preveri, katere datoteke si spremenil
```bash
git status
```

**Output:**
```
On branch PM-1
Changes not staged for commit:
  modified:   backend/app.js
  modified:   web/src/App.js
  new file:   documentation/new-file.md
```

---

## 📦 Korak 4: Stage vse spremembe

### 4.1 Dodaj vse spremembe v staging area
```bash
git add --all
```

Ali za posamezne datoteke:
```bash
git add backend/app.js
git add web/src/App.js
```

### 4.2 Preveri, kaj je v staging area
```bash
git status
```

**Output:**
```
On branch PM-1
Changes to be committed:
  modified:   backend/app.js
  modified:   web/src/App.js
  new file:   documentation/new-file.md
```

---

## 💾 Korak 5: Commitaj spremembe

### 5.1 Naredi commit z pravilnim formatom

**Format commit sporočila:** `ISSUE-KEY kratek-opis-sprememb`

```bash
git commit -m "PM-1 popravki-dizajna-logina"
```

**Primeri dobrih commit sporočil:**
```bash
git commit -m "PM-1 dodana-funkcionalnost-registracije"
git commit -m "TASK-123 popravljena-napaka-api-klicev"
git commit -m "BUG-45 izboljsana-validacija-forme"
```

> ⚠️ **Warning**: 
> - Commit sporočilo je sestavljeno iz "ISSUE-KEY sporočilo"
> - Obvezno pazi na poimenovanje commita, drugače JIRA ne bo povezana z tem commitom
> - Za ISSUE-KEY daj presledek, nato na kratko opiši kaj si naredil
> - Presledke v opisu zamenjaj z znakom "-"

### 5.2 Preveri commit zgodovino
```bash
git log --oneline -5
```

---

## 🚀 Korak 6: Pushaj spremembe na GitHub

### 6.1 Preveri, da si še vedno na pravem branchu
```bash
git branch
```

**Mora biti:**
```
* PM-1
  main
```

### 6.2 Pushaj branch na GitHub
```bash
git push -u origin PM-1
```

> ⚠️ **Warning**: Pazi na ime brancha na koncu - mora biti tvoj JIRA issue key!

**Output:**
```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 1.2 KiB | 1.2 MiB/s, done.
Total 3 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To https://github.com/BlazBracko/healthy-lifestyle-app.git
 * [new branch]      PM-1 -> PM-1
Branch 'PM-1' set up to track remote branch 'PM-1' from 'origin'.
```

### 6.3 Preveri na GitHub-u

1. Odpri GitHub repozitorij v brskalniku
2. Klikni na "branches" ali "Compare & pull request"
3. Preveri, da se tvoj branch prikaže

---

## 🔄 Korak 7: Dodatne spremembe na istem branchu

Če želiš dodati še več sprememb na isti branch:

### 7.1 Preveri, da si na pravem branchu
```bash
git branch
```

### 7.2 Naredi spremembe in commitaj
```bash
git add --all
git commit -m "PM-1 dodatne-izboljsave"
```

### 7.3 Pushaj spremembe
```bash
git push
```

> **Opomba**: Če si že nastavil tracking z `-u origin PM-1`, lahko samo uporabiš `git push`.

---

## 🔍 Preverjanje pred pushom - Checklist

Preden pushaš, vedno preveri:

- [ ] ✅ Si na pravem branchu? (`git branch`)
- [ ] ✅ Branch ime ustreza JIRA issue key?
- [ ] ✅ Commit sporočilo vsebuje JIRA issue key?
- [ ] ✅ Vse spremembe so staged? (`git status`)
- [ ] ✅ Si preveril, da koda deluje lokalno?

---

## 🆘 Pogoste napake in rešitve

### Napaka: "You are not currently on a branch"
```bash
# Rešitev: Preveri, da si na branchu
git branch
git checkout main  # ali tvoj branch
```

### Napaka: "Updates were rejected because the remote contains work"
```bash
# Rešitev: Povleci najnovejše spremembe
git pull origin main
# Reši morebitne konflikte
git push
```

### Napaka: Napačen branch ime
```bash
# Rešitev: Preimenuj branch
git branch -m stari-branch PM-1
git push -u origin PM-1
```

### Napaka: Pozabil si JIRA issue key v commit sporočilu
```bash
# Rešitev: Spremeni zadnji commit
git commit --amend -m "PM-1 pravilno-sporocilo"
git push --force  # Pazljivo! Uporabi samo če si edini, ki dela na branchu
```

---

## 📝 Povzetek - Hitri workflow

```bash
# 1. Preveri status
git status
git branch

# 2. Preveri, da si na main in povleci spremembe
git checkout main
git pull

# 3. Ustvari nov branch
git checkout -b PM-1

# 4. Naredi spremembe v kodi...

# 5. Stage in commit
git add --all
git commit -m "PM-1 opis-sprememb"

# 6. Preveri, da si na pravem branchu
git branch

# 7. Pushaj
git push -u origin PM-1
```

---

## ✅ Uspešno!

Če si sledil vsem korakom, bi moral imeti:
- ✅ Spremembe commitane z pravilnim formatom
- ✅ Branch pushan na GitHub
- ✅ Branch prikazan na GitHub-u
- ✅ JIRA issue povezan z commitom (če je konfigurirano)

**Veselo kodiranje! 🎉**
