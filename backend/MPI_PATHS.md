# Pomembno: Poti za porazdeljeni MPI

## Problem
Worker računalnik mora imeti dostop do:
1. Python skript (`dataSet_mpi.py`, `test_mpi.py`)
2. Video datoteke (če se obdelujejo)
3. `learnPhotos` direktorij (za shranjevanje slik)

## Rešitve

### Možnost 1: NFS (Network File System) - PRIPOROČENO

**Prednosti:**
- Vsi računalniki vidijo iste datoteke
- Ni potrebno kopiranje
- Avtomatska sinhronizacija

**Nastavitev:**
1. Na master računalniku nastavi NFS share za celoten `backend` direktorij
2. Na worker računalniku mount-aj NFS share
3. Uporabi absolutne poti v MPI ukazih

### Možnost 2: Kopiranje datotek na worker

**Prednosti:**
- Enostavno za testiranje
- Ne zahteva NFS

**Slabosti:**
- Moramo ročno kopirati datoteke
- Video datoteke morajo biti kopirane
- Rezultati morajo biti kopirani nazaj

**Koraki:**
```bash
# Kopiraj projekt na worker
scp -r backend/ valbracko@192.168.50.244:~/hla_backend/

# Na worker računalniku:
cd ~/hla_backend
mpirun -np 1 python3 test_mpi.py
```

### Možnost 3: SSHFS (SSH File System)

**Prednosti:**
- Enostavna nastavitev
- Ne zahteva NFS strežnika

**Nastavitev:**
```bash
# Na worker računalniku:
brew install sshfs  # ali sudo apt-get install sshfs
mkdir -p ~/hla_mount
sshfs blazbracko@<master-ip>:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend ~/hla_mount

# Uporabi v MPI:
cd ~/hla_mount
mpirun -np 1 python3 test_mpi.py
```

## Trenutna situacija

Za testiranje moraš:
1. Ugotoviti, kje je projekt na worker računalniku
2. Kopirati `test_mpi.py` in `dataSet_mpi.py` na worker
3. Ali nastaviti NFS/SSHFS za deljeni dostop

## Preveri poti na worker

```bash
ssh valbracko@192.168.50.244 "pwd && ls -la"
```

Nato kopiraj potrebne datoteke:
```bash
scp backend/test_mpi.py backend/dataSet_mpi.py valbracko@192.168.50.244:~/test_mpi/
```

Ali uporabi absolutno pot v MPI ukazu:
```bash
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 \
  python3 /absolutna/pot/do/test_mpi.py
```
