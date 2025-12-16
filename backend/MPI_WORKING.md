# ✅ MPI deluje! - Navodila za uporabo

## Status
✅ **MPI komunikacija deluje med master in worker računalnikom!**

Test rezultat:
- Rank 0: master (Blazs-MacBook-Pro-3.local)
- Rank 1: worker (Mac - 192.168.50.244)
- Komunikacija: ✅ deluje

## Nastavitev deljenih direktorijev

### Trenutna struktura:
- **Master**: `/Users/blazbracko/hla_backend/`
- **Worker**: `/Users/valbracko/hla_backend/`

### Potrebne datoteke:
1. `dataSet_mpi.py` - ✅ kopirano na oba računalnika
2. `test_mpi.py` - ✅ kopirano na oba računalnika
3. Video datoteke - morajo biti dostopne na obeh računalnikih
4. `learnPhotos/` - mora biti deljen direktorij

## Naslednji koraki

### 1. Nastavi deljen direktorij za `learnPhotos`

**Možnost A: NFS (priporočeno)**
```bash
# Na master računalniku nastavi NFS share
# Na worker računalniku mount-aj NFS
```

**Možnost B: SSHFS (za testiranje)**
```bash
# Na worker računalniku:
brew install sshfs
mkdir -p ~/learnPhotos_mount
sshfs blazbracko@<master-ip>:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount
```

**Možnost C: Ročno kopiranje (za testiranje)**
```bash
# Po končani obdelavi kopiraj datoteke z worker na master
scp -r valbracko@192.168.50.244:~/hla_backend/learnPhotos/* backend/learnPhotos/
```

### 2. Preveri Python pakete na worker

```bash
ssh valbracko@192.168.50.244 "python3 -c 'import cv2, numpy; print(\"OK\")'"
```

Če manjka:
```bash
ssh valbracko@192.168.50.244 "pip3 install opencv-python numpy"
```

### 3. Testiraj z dejanskim video

```bash
# Kopiraj video na oba računalnika
scp backend/uploads/test_video.mp4 valbracko@192.168.50.244:~/hla_backend/

# Zaženi MPI
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 dataSet_mpi.py ~/hla_backend/test_video.mp4 testuser
```

### 4. Posodobi `dataSet_mpi.py` za deljen direktorij

Spremeni vrstico 239 v `dataSet_mpi.py`:
```python
# Za NFS:
save_path = os.path.join('/mnt/learnPhotos', username)

# Za SSHFS:
save_path = os.path.join(os.path.expanduser('~/learnPhotos_mount'), username)

# Za lokalno (testiranje):
save_path = os.path.join('learnPhotos', username)
```

## Testiranje preko Node.js API

Ko je vse nastavljeno:
1. Zaženi backend: `npm run dev`
2. Pošlji video preko API
3. Preveri loge za MPI output

## Pomembne opombe

1. **Poti**: Vsi procesi morajo imeti dostop do istih datotek
2. **Video datoteke**: Morajo biti kopirane ali dostopne preko NFS/SSHFS
3. **Rezultati**: `learnPhotos` mora biti deljen direktorij ali kopiran nazaj
4. **Python paketi**: Oba računalnika morata imeti iste pakete (cv2, numpy, mpi4py)
