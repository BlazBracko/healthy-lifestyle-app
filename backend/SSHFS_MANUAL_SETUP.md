# Ročna nastavitev SSHFS na worker računalniku

## Korak 1: Namesti macfuse in sshfs

**Na worker računalniku (direktno, ne preko SSH):**

```bash
# Namesti macfuse (zahteva sudo geslo)
brew install --cask macfuse

# Namesti sshfs
brew install sshfs
```

**Opomba**: macfuse zahteva administrator geslo, zato moraš biti direktno na worker računalniku.

## Korak 2: Ustvari mount point

```bash
mkdir -p ~/learnPhotos_mount
```

## Korak 3: Preveri SSH povezavo z master

```bash
# Preveri, ali lahko povežeš na master brez gesla
ssh blazbracko@192.168.50.202 "echo 'SSH OK'"
```

Če zahteva geslo, nastavi SSH ključ:
```bash
# Na master računalniku:
ssh-copy-id blazbracko@192.168.50.202
```

## Korak 4: Mount SSHFS

```bash
sshfs blazbracko@192.168.50.202:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount
```

## Korak 5: Preveri mount

```bash
ls ~/learnPhotos_mount
# Moralo bi pokazati vsebino learnPhotos direktorija z master računalnika

# Test pisanja:
touch ~/learnPhotos_mount/test.txt
ls ~/learnPhotos_mount/test.txt

# Na master računalniku preveri:
ls backend/learnPhotos/test.txt
# Datoteka mora biti vidna!
```

## Unmount

```bash
umount ~/learnPhotos_mount
```

## Trajna nastavitev (opcijsko)

Dodaj v `~/.zprofile` na worker računalniku:

```bash
# Auto-mount SSHFS za learnPhotos
if ! mountpoint -q ~/learnPhotos_mount 2>/dev/null; then
    sshfs blazbracko@192.168.50.202:/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos ~/learnPhotos_mount 2>/dev/null
fi
```

## Troubleshooting

### Problem: "fuse: failed to mount"
**Rešitev**: Preveri, ali je macfuse nameščen:
```bash
ls /Library/Frameworks/macfuse.framework
```

### Problem: "Permission denied"
**Rešitev**: Preveri SSH povezavo in dovoljenja:
```bash
ssh blazbracko@192.168.50.202 "ls -la /Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos"
```

### Problem: Mount deluje, vendar ne morem pisati
**Rešitev**: Preveri dovoljenja na master:
```bash
chmod -R 755 backend/learnPhotos
```
