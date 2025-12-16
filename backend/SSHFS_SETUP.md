# Nastavitev SSHFS za deljen direktorij learnPhotos

## Pregled
SSHFS omogoča, da worker računalnik vidi master direktorij `learnPhotos` kot lokalni direktorij.

## Avtomatska nastavitev

Zaženi skripto:
```bash
cd backend
./setup_sshfs.sh
```

## Ročna nastavitev

### Korak 1: Namesti sshfs na worker računalniku

```bash
ssh valbracko@192.168.50.244
brew install sshfs
```

### Korak 2: Ustvari mount point

```bash
ssh valbracko@192.168.50.244
mkdir -p ~/learnPhotos_mount
```

### Korak 3: Preveri SSH povezavo z master

```bash
# Na worker računalniku:
ssh blazbracko@192.168.50.202 "echo 'SSH OK'"
```

Če zahteva geslo, nastavi SSH ključ:
```bash
# Na master računalniku:
ssh-copy-id blazbracko@192.168.50.202
```

### Korak 4: Mount SSHFS

```bash
# Na worker računalniku:
sshfs blazbracko@192.168.50.202:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount
```

### Korak 5: Preveri mount

```bash
# Na worker računalniku:
ls ~/learnPhotos_mount
# Moralo bi pokazati vsebino learnPhotos direktorija z master računalnika
```

## Preverjanje

```bash
# Na worker računalniku:
cd ~/learnPhotos_mount
touch test.txt
ls -la

# Na master računalniku:
ls -la backend/learnPhotos/test.txt
# Datoteka mora biti vidna!
```

## Unmount

```bash
# Na worker računalniku:
umount ~/learnPhotos_mount
# ali
fusermount -u ~/learnPhotos_mount  # Če umount ne deluje
```

## Trajna nastavitev (opcijsko)

Za avtomatski mount ob zagonu, dodaj v `~/.zprofile` na worker računalniku:

```bash
# Auto-mount SSHFS
if ! mountpoint -q ~/learnPhotos_mount 2>/dev/null; then
    sshfs blazbracko@192.168.50.202:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount
fi
```

## Troubleshooting

### Problem: "sshfs: command not found"
**Rešitev**: Namesti sshfs: `brew install sshfs`

### Problem: "fuse: failed to mount"
**Rešitev**: 
```bash
# Na macOS morda potrebuješ:
brew install macfuse
# Nato ponovno namesti sshfs
```

### Problem: "Permission denied"
**Rešitev**: Preveri SSH povezavo:
```bash
ssh blazbracko@192.168.50.202 "ls /Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos"
```

### Problem: Mount deluje, vendar ne morem pisati
**Rešitev**: Preveri dovoljenja na master:
```bash
chmod -R 755 backend/learnPhotos
```

## Kako deluje

1. **Master računalnik**: `backend/learnPhotos/` - dejanski direktorij
2. **Worker računalnik**: `~/learnPhotos_mount/` - SSHFS mount point, ki kaže na master direktorij
3. **dataSet_mpi.py**: Avtomatsko zazna SSHFS mount in uporabi pravilno pot

Ko worker shranjuje slike v `~/learnPhotos_mount/username/`, se dejansko shranjujejo na master računalnik v `backend/learnPhotos/username/`.
