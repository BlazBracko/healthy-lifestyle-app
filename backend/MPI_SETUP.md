# Nastavitev porazdeljenega MPI za Healthy Lifestyle App

## ⚠️ POMEMBNO: OpenMPI 5.x na macOS
OpenMPI 5.x na macOS ima znano težavo z `--hostfile` pri več fizičnih nodih (PMIX_ERR_UNREACH).
**Rešitev**: Uporabi colon syntax (`-H`) namesto `--hostfile`:
```bash
# Namesto: mpirun -np 2 --hostfile hostfile.txt ...
# Uporabi:  mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 ...
```

## Pregled
- **Master**: localhost (tvoj računalnik)
- **Worker**: valbracko@192.168.50.244

## Korak 1: Preveri SSH povezavo brez gesla

### Na master računalniku (localhost):

```bash
# Preveri, ali lahko povežeš na worker brez gesla
ssh valbracko@192.168.50.244 "echo 'SSH connection successful'"

# Če zahteva geslo, nastavi SSH ključ:
ssh-keygen -t rsa -b 4096  # Če še nimaš ključa
ssh-copy-id valbracko@192.168.50.244
```

### Preveri, ali deluje:
```bash
ssh valbracko@192.168.50.244 "hostname"
# Moralo bi izpisati hostname worker računalnika brez gesla
```

## Korak 2: Preveri MPI nameščitev

### Na master računalniku:
```bash
which mpirun
mpirun --version
python3 -c "import mpi4py; print(mpi4py.__version__)"
```

### Na worker računalniku (preko SSH):
```bash
ssh valbracko@192.168.50.244 "which mpirun && mpirun --version && python3 -c 'import mpi4py; print(mpi4py.__version__)'"
```

**Pomembno**: Oba računalnika morata imeti nameščen OpenMPI in mpi4py!

## Korak 3: Nastavi hostfile.txt

Datoteka `backend/hostfile.txt` mora biti:
```
localhost slots=1
valbracko@192.168.50.244 slots=1
```

**Preveri, ali obstaja:**
```bash
cat backend/hostfile.txt
```

## Korak 4: Nastavi dostop do learnPhotos direktorija

**Problem**: Worker shranjuje slike lokalno, vendar morajo biti dostopne na master računalniku za `learn.py`.

### Možnost A: NFS (Network File System) - PRIPOROČENO

**Na master računalniku:**
```bash
# Preveri, ali je NFS nameščen
which nfsd  # macOS
# ali
systemctl status nfs-server  # Linux

# Če ni nameščen, namesti:
# macOS: NFS je že vključen, samo nastavi
# Linux: sudo apt-get install nfs-kernel-server
```

**Nastavi NFS share za learnPhotos:**
1. Uredi `/etc/exports` (Linux) ali `/etc/exports` (macOS):
   ```
   /Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos 192.168.50.244(rw,sync,no_subtree_check)
   ```

2. Restartaj NFS:
   ```bash
   # macOS
   sudo nfsd restart
   
   # Linux
   sudo systemctl restart nfs-server
   ```

**Na worker računalniku:**
```bash
# Ustvari mount point
sudo mkdir -p /mnt/learnPhotos

# Mount NFS share
sudo mount -t nfs localhost:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos /mnt/learnPhotos

# Preveri
ls /mnt/learnPhotos
```

**Popravi `dataSet_mpi.py`:**
Spremeni vrstico 239 v:
```python
save_path = os.path.join('/mnt/learnPhotos', username)
```

### Možnost B: SCP kopiranje po končani obdelavi (MANJ ELEGANTNO)

Worker shrani lokalno, nato master kopira datoteke. To zahteva dodatno logiko v `dataSet_mpi.py`.

### Možnost C: Deljeni direktorij preko SSHFS (ALTERNATIVA)

**Na worker računalniku:**
```bash
# Namesti sshfs
sudo apt-get install sshfs  # Linux
# ali
brew install sshfs  # macOS

# Mount master direktorij
mkdir -p ~/learnPhotos_mount
sshfs blazbracko@<master-ip>:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount

# Uporabi v dataSet_mpi.py:
save_path = os.path.join(os.path.expanduser('~/learnPhotos_mount'), username)
```

## Korak 5: Testiraj MPI povezavo

### Test 1: Osnovni MPI test
```bash
cd backend
# OpenMPI 5.x na macOS: uporabi colon syntax namesto --hostfile
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 test_mpi.py
```

**Pričakovan izhod:**
```json
{"rank": 0, "size": 2, "hostname": "...", ...}
{"rank": 1, "size": 2, "hostname": "...", ...}
{"status": "sent", "from": 0, "to": 1, ...}
{"status": "received", "from": 1, ...}
{"status": "test_completed"}
```

### Test 2: Preveri dostop do direktorijev
```bash
mpirun -np 2 --hostfile hostfile.txt python3 -c "
from mpi4py import MPI
import os
comm = MPI.COMM_WORLD
rank = comm.Get_rank()
print(f'Rank {rank}: cwd={os.getcwd()}, learnPhotos exists={os.path.exists(\"learnPhotos\")}')
"
```

## Korak 6: Testiraj z dejanskim video

### Preveri, ali je video dostopen
```bash
# Preveri, ali video obstaja na master
ls -lh backend/uploads/*.mp4

# Preveri, ali je dostopen preko SSH (če uporabljaš NFS, ni potrebno)
ssh valbracko@192.168.50.244 "ls -lh /path/to/video"
```

### Zaženi dataSet_mpi.py direktno (za testiranje)
```bash
cd backend
# OpenMPI 5.x na macOS: uporabi colon syntax
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 dataSet_mpi.py uploads/test_video.mp4 testuser
```

### Testiraj preko Node.js API
```bash
# V drugem terminalu zaženi backend
cd backend
npm run dev

# Nato pošlji video preko API (npr. z curl ali Postman)
curl -X POST http://localhost:3000/api/recognition/upload-video/testuser \
  -F "video=@test_video.mp4"
```

## Korak 7: Debugging

### Če MPI ne deluje:

1. **Preveri SSH:**
   ```bash
   ssh valbracko@192.168.50.244 "echo 'test'"
   ```

2. **Preveri MPI na worker:**
   ```bash
   ssh valbracko@192.168.50.244 "mpirun --version"
   ```

3. **Preveri Python in mpi4py na worker:**
   ```bash
   ssh valbracko@192.168.50.244 "python3 -c 'import mpi4py; print(mpi4py.__version__)'"
   ```

4. **Preveri poti:**
   ```bash
   ssh valbracko@192.168.50.244 "cd /path/to/backend && pwd && ls -la"
   ```

5. **Dodaj verbose output:**
   ```bash
   # OpenMPI 5.x na macOS: uporabi colon syntax
   mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 --mca btl_base_verbose 30 python3 test_mpi.py
   ```

### Če se datoteke ne shranjujejo:

1. Preveri dovoljenja za `learnPhotos`:
   ```bash
   ls -la backend/learnPhotos
   chmod -R 755 backend/learnPhotos  # Če je potrebno
   ```

2. Preveri, ali worker lahko piše v direktorij:
   ```bash
   ssh valbracko@192.168.50.244 "touch /mnt/learnPhotos/test.txt && rm /mnt/learnPhotos/test.txt"
   ```

## Pomembne opombe

1. **Python poti**: Oba računalnika morata imeti Python 3 in iste pakete (cv2, numpy, mpi4py).

2. **Deljeni direktorij**: `learnPhotos` mora biti dostopen na obeh računalnikih (NFS ali SSHFS).

3. **Video datoteke**: Video mora biti dostopen na master računalniku (ali preko NFS).

4. **Firewall**: Preveri, ali firewall blokira MPI komunikacijo (porti 1024-65535).

5. **Hostname resolution**: Preveri, ali se IP naslovi pravilno razrešijo:
   ```bash
   ping 192.168.50.244
   ```

## Naslednji koraki

Ko vse deluje:
1. Testiraj z manjšim video (npr. 10 sekund)
2. Preveri, ali se slike shranjujejo pravilno
3. Preveri, ali `learn.py` najde vse slike
4. Optimiziraj število procesov (`-np 2` lahko povečaš na več)
