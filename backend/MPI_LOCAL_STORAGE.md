# Porazdeljeno shranjevanje z lokalnim shranjevanjem in kopiranjem

## Kako deluje

### 1. Master proces (rank 0)
- Ekstrahira vse frame-e iz videa
- Razdeli frame-e med procese (round-robin)
- Obdela svoje frame-e in shrani lokalno v `learnPhotos/username/`
- Po končani obdelavi kopira datoteke z worker računalnikov

### 2. Worker proces (rank 1+)
- Prejme svoje frame-e od master procesa
- Obdela frame-e lokalno (augmentacije)
- Shrani slike lokalno v `~/hla_backend/learnPhotos/username/`
- Pošlje seznam shranjenih datotek nazaj master procesu

### 3. Kopiranje datotek
- Master proces zbira sezname datotek od vseh procesov
- Za vsako datoteko z worker računalnika:
  - Uporabi SCP za kopiranje
  - Shrani v `learnPhotos/username/` na master računalniku

## Prednosti

✅ **Enostavna nastavitev** - ni potrebno NFS/SSHFS  
✅ **Lokalno shranjevanje** - hitrejše pisanje na worker  
✅ **Avtomatsko kopiranje** - master zbira vse datoteke  

## Slabosti

⚠️ **Počasnejše kopiranje** - SCP za vsako datoteko posebej  
⚠️ **Omrežni promet** - vse datoteke se kopirajo preko omrežja  

## Struktura direktorijev

### Master računalnik:
```
backend/
  learnPhotos/
    username/
      original_0.jpg
      bright_0.jpg
      ...
```

### Worker računalnik (začasno):
```
~/hla_backend/
  learnPhotos/
    username/
      original_1.jpg
      bright_1.jpg
      ...
```

Po kopiranju se datoteke shranijo na master in worker direktorij lahko izbrišeš.

## Testiranje

```bash
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 dataSet_mpi.py test_video.mp4 testuser
```

Preveri rezultate:
```bash
ls backend/learnPhotos/testuser/
```

## Optimizacije (za prihodnost)

1. **Batch SCP** - kopiraj več datotek naenkrat
2. **RSYNC** - uporabi rsync namesto SCP za hitrejše kopiranje
3. **Kompresija** - kompresiraj datoteke pred kopiranjem
4. **Paralelno kopiranje** - kopiraj več datotek hkrati
