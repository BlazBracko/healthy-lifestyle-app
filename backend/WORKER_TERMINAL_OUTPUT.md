# Kako spremljati worker output na worker računalniku

## Pregled

Worker procesi sedaj pišejo v lokalno log datoteko na worker računalniku (`~/hla_backend/logs/worker_1_<username>.log`). Ta datoteka se izpisuje samo lokalno na worker računalniku, ne na master.

## Kako uporabljati

### Možnost 1: Uporabi watch_worker_log.sh skripto (priporočeno)

**Na master računalniku** (v drugem terminalu):
```bash
cd backend
bash watch_worker_log.sh testuser
```

Ta skripta avtomatsko:
- Poveže se na worker računalnik
- Najde najnovejšo log datoteko
- Prikaže output v real-time (`tail -f`)

### Možnost 2: Ročno na worker računalniku

**Na worker računalniku** (direktno ali preko SSH):
```bash
# Poveži se na worker
ssh valbracko@192.168.50.244

# Spremljaj log datoteko
tail -f ~/hla_backend/logs/worker_1_testuser.log
```

### Možnost 3: Dva terminala

**Terminal 1 (Master):**
```bash
cd backend
bash run_mpi_final.sh uploads/test_video.mp4 testuser
```

**Terminal 2 (Worker - SSH):**
```bash
ssh valbracko@192.168.50.244
tail -f ~/hla_backend/logs/worker_1_testuser.log
```

## Lokacija log datotek

Log datoteke so na worker računalniku v:
```
~/hla_backend/logs/worker_1_<username>.log
```

Primer:
```
/Users/valbracko/hla_backend/logs/worker_1_testuser.log
```

## Kaj se izpisuje v log datoteki

```
============================================================
[WORKER 1 @ Mac] MPI proces zagnan
[WORKER 1] Video: test_video.mp4
[WORKER 1] Uporabnik: testuser
[WORKER 1] Shranjujem v: /Users/valbracko/hla_backend/learnPhotos/testuser
[WORKER 1] Log datoteka: /Users/valbracko/hla_backend/logs/worker_1_testuser.log
============================================================

[WORKER 1 @ Mac] Začenjam obdelavo 22 frame-ov...
[WORKER 1] Shranjujem v: /Users/valbracko/hla_backend/learnPhotos/testuser
[WORKER 1] Napredek: 5/22 frame-ov (22.7%), shranjenih 25 datotek
[WORKER 1] Napredek: 10/22 frame-ov (45.5%), shranjenih 50 datotek
[WORKER 1] Napredek: 15/22 frame-ov (68.2%), shranjenih 75 datotek
[WORKER 1] Napredek: 20/22 frame-ov (90.9%), shranjenih 100 datotek

[WORKER 1 @ Mac] ✅ Končano!
[WORKER 1] Obdelanih: 22 frame-ov
[WORKER 1] Shranjenih: 110 datotek
[WORKER 1] Lokacija: /Users/valbracko/hla_backend/learnPhotos/testuser
[WORKER 1] Čakam na master za kopiranje datotek...
```

## Prednosti

✅ **Lokalno izpisovanje**: Output se izpisuje samo na worker računalniku  
✅ **Real-time spremljanje**: Uporabi `tail -f` za real-time output  
✅ **Ločen output**: Master in worker output sta ločena  
✅ **Debugging**: Lažje debugiranje, ker vidiš, kaj se dogaja na worker računalniku  

## Troubleshooting

### Problem: Log datoteka ne obstaja
**Rešitev**: Počakaj, da se MPI zažene. Log datoteka se ustvari ob zagonu worker procesa.

### Problem: Ne morem brati log datoteke
**Rešitev**: Preveri dovoljenja:
```bash
ls -la ~/hla_backend/logs/
chmod -R 755 ~/hla_backend/logs/
```

### Problem: Log datoteka je prazna
**Rešitev**: Preveri, ali worker proces dejansko deluje in ali ima dovoljenja za pisanje.
