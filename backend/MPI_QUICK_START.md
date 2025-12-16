# 🚀 Hitri vodič za MPI testiranje

## ✅ Status: MPI deluje!

Test je uspešen:
- Master: Blazs-MacBook-Pro-3.local (rank 0)
- Worker: Mac/192.168.50.244 (rank 1)
- Komunikacija: ✅ deluje

## Testiranje

### 1. Osnovni MPI test
```bash
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 test_mpi.py
```

### 2. Test z video (zahteva nastavitev)

**Korak 1: Kopiraj video na worker**
```bash
scp backend/uploads/test_video.mp4 valbracko@192.168.50.244:~/hla_backend/
```

**Korak 2: Zaženi MPI**
```bash
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 dataSet_mpi.py ~/hla_backend/test_video.mp4 testuser
```

## Nastavitev deljenega direktorija za learnPhotos

### Možnost 1: SSHFS (hitro za testiranje)

**Na worker računalniku:**
```bash
brew install sshfs
mkdir -p ~/learnPhotos_mount
sshfs blazbracko@<master-ip>:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount
```

**Popravi `dataSet_mpi.py` vrstico 239:**
```python
save_path = os.path.join(os.path.expanduser('~/learnPhotos_mount'), username)
```

### Možnost 2: Ročno kopiranje (za testiranje)

Po končani obdelavi:
```bash
scp -r valbracko@192.168.50.244:~/hla_backend/learnPhotos/* backend/learnPhotos/
```

## Preveri Python pakete

**Na worker:**
```bash
ssh valbracko@192.168.50.244 "python3 -c 'import cv2, numpy, mpi4py; print(\"OK\")'"
```

**Rezultat:** ✅ cv2: 4.12.0, numpy: 2.0.2, mpi4py: nameščen

## Testiranje preko Node.js API

1. Posodobi `recognitionController.js` - že posodobljen ✅
2. Zaženi backend: `npm run dev`
3. Pošlji video preko API
4. Preveri MPI output v logih

## Pomembne opombe

1. **Poti**: 
   - Master: `/Users/blazbracko/hla_backend/`
   - Worker: `/Users/valbracko/hla_backend/`

2. **Video datoteke**: Morajo biti kopirane ali dostopne preko NFS/SSHFS

3. **Rezultati**: `learnPhotos` mora biti deljen direktorij ali kopiran nazaj

4. **Colon syntax**: Uporabljamo `-H localhost:1,valbracko@192.168.50.244:1` namesto `--hostfile` zaradi OpenMPI 5.x težav na macOS

## Naslednji koraki

1. ✅ MPI komunikacija deluje
2. ⏳ Nastavi deljen direktorij za `learnPhotos` (SSHFS ali NFS)
3. ⏳ Testiraj z dejanskim video
4. ⏳ Preveri, ali se slike shranjujejo pravilno
5. ⏳ Testiraj preko Node.js API
