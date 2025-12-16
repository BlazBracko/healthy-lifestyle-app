# Worker Terminal Output

## Kako deluje

Worker procesi sedaj izpisujejo status direktno v svoj lokalni terminal preko `sys.stderr`, medtem ko se JSON statusi za master še vedno izpisujejo preko `sys.stdout`.

## Kaj se izpisuje na worker terminalu

Ko zaženeš MPI na master računalniku, se na worker računalniku (če imaš odprt terminal) izpisuje:

```
============================================================
[WORKER 1 @ Mac] MPI proces zagnan
[WORKER 1] Video: test_video.mp4
[WORKER 1] Uporabnik: testuser
[WORKER 1] Shranjujem v: /Users/valbracko/hla_backend/learnPhotos/testuser
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

## Kako videti worker output

### Možnost 1: Odpri terminal na worker računalniku

Na worker računalniku odpri terminal in zaženi:
```bash
# Output se bo izpisoval avtomatsko, ko master zažene MPI
# Ni potrebno nič narediti, samo odpri terminal
```

### Možnost 2: SSH v worker in spremljaj

```bash
ssh valbracko@192.168.50.244
# Output se bo izpisoval, ko master zažene MPI
```

### Možnost 3: Tail log datoteke (če bi dodali logging)

Za prihodnost bi lahko dodali logging v datoteko in uporabili `tail -f`.

## Razlika med stdout in stderr

- **stdout** (`sys.stdout`): Zbrano na master računalniku, uporablja se za JSON status sporočila
- **stderr** (`sys.stderr`): Lokalno na vsakem računalniku, uporablja se za worker terminal output

## Prednosti

✅ **Vidnost**: Vidiš, da worker dejansko dela  
✅ **Debugging**: Lažje debugiranje, če worker ne deluje  
✅ **Demonstracija**: Lahko pokažeš, da se obdelava dejansko dogaja na worker računalniku  
✅ **Ne vpliva na master**: Worker output ne meša master outputa  
