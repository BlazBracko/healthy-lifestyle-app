# Status SSHFS nastavitve

## ✅ Narejeno

1. **dataSet_mpi.py posodobljen** - avtomatsko zazna SSHFS mount in uporabi pravilno pot
2. **Skripta za nastavitev** - `setup_sshfs.sh` (zahteva ročno namestitev macfuse)
3. **Dokumentacija** - `SSHFS_MANUAL_SETUP.md` z navodili

## ⏳ Potrebno narediti na worker računalniku

**Na worker računalniku (direktno, ne preko SSH):**

```bash
# 1. Namesti macfuse (zahteva sudo geslo)
brew install --cask macfuse

# 2. Namesti sshfs
brew install sshfs

# 3. Ustvari mount point
mkdir -p ~/learnPhotos_mount

# 4. Mount SSHFS
sshfs blazbracko@192.168.50.202:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount

# 5. Preveri
ls ~/learnPhotos_mount
touch ~/learnPhotos_mount/test.txt
```

## Kako deluje po nastavitvi

1. **Master ekstrahira frame-e** iz videa
2. **Master pošlje frame-e** worker procesu preko MPI scatter
3. **Worker obdela frame-e** lokalno (augmentacije)
4. **Worker shranjuje slike** v `~/learnPhotos_mount/username/`
5. **Slike se dejansko shranjujejo** na master v `backend/learnPhotos/username/`
6. **learn.py** najde vse slike na master računalniku

## Testiranje

Ko je SSHFS mount-an, testiraj:

```bash
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 dataSet_mpi.py test_video.mp4 testuser
```

Preveri, ali se slike shranjujejo:
```bash
ls backend/learnPhotos/testuser/
```

## Alternativa (če SSHFS ne deluje)

Če SSHFS ne deluje, lahko uporabiš ročno kopiranje:

```bash
# Po končani obdelavi kopiraj datoteke z worker na master
scp -r valbracko@192.168.50.244:~/hla_backend/learnPhotos/* backend/learnPhotos/
```

Vendar to zahteva dodatno logiko v `dataSet_mpi.py` za kopiranje po končani obdelavi.
