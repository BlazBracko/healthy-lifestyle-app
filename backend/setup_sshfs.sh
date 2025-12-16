#!/bin/bash
# Skripta za nastavitev SSHFS na worker računalniku

WORKER_HOST="valbracko@192.168.50.244"
MASTER_IP="192.168.50.202"
MASTER_USER="blazbracko"
MASTER_PATH="/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/learnPhotos"
WORKER_MOUNT_POINT="~/learnPhotos_mount"

echo "=== Nastavitev SSHFS za deljen direktorij learnPhotos ==="
echo ""
echo "Master: $MASTER_USER@$MASTER_IP:$MASTER_PATH"
echo "Worker mount point: $WORKER_MOUNT_POINT"
echo ""

# Korak 1: Namesti sshfs na worker
echo "1. Preverjam, ali je sshfs nameščen na worker..."
if ssh $WORKER_HOST "which sshfs" >/dev/null 2>&1; then
    echo "   ✅ sshfs je že nameščen"
else
    echo "   ⚠️  sshfs ni nameščen"
    echo "   Poskušam namestiti..."
    ssh $WORKER_HOST "eval \"\$(/opt/homebrew/bin/brew shellenv)\" && brew install sshfs" || {
        echo "   ⚠️  Avtomatska namestitev ni uspela"
        echo ""
        echo "   Namesti ročno:"
        echo "   ssh $WORKER_HOST"
        echo "   eval \"\$(/opt/homebrew/bin/brew shellenv)\""
        echo "   brew install sshfs"
        echo ""
        read -p "   Ali je sshfs že nameščen? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "   Namesti sshfs preden nadaljuješ!"
            exit 1
        fi
    }
fi

# Korak 2: Ustvari mount point na worker
echo ""
echo "2. Ustvarjam mount point na worker..."
ssh $WORKER_HOST "mkdir -p $WORKER_MOUNT_POINT" || {
    echo "   ❌ Napaka pri ustvarjanju mount pointa"
    exit 1
}
echo "   ✅ Mount point ustvarjen"

# Korak 3: Preveri SSH povezavo
echo ""
echo "3. Preverjam SSH povezavo..."
if ssh $WORKER_HOST "ssh -o ConnectTimeout=5 $MASTER_USER@$MASTER_IP 'echo OK' 2>/dev/null" | grep -q "OK"; then
    echo "   ✅ SSH povezava deluje"
else
    echo "   ⚠️  SSH povezava z master ne deluje direktno"
    echo "   Nastavi SSH ključ: ssh-copy-id $MASTER_USER@$MASTER_IP"
fi

# Korak 4: Mount SSHFS
echo ""
echo "4. Mount-aj SSHFS..."
echo "   Ukaz za mount:"
echo "   ssh $WORKER_HOST \"sshfs $MASTER_USER@$MASTER_IP:$MASTER_PATH $WORKER_MOUNT_POINT\""
echo ""
read -p "Ali želiš, da skripta poskusi mount-ati SSHFS zdaj? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh $WORKER_HOST "sshfs $MASTER_USER@$MASTER_IP:$MASTER_PATH $WORKER_MOUNT_POINT" && {
        echo "   ✅ SSHFS uspešno mount-an"
    } || {
        echo "   ⚠️  Mount ni uspel. Poskusi ročno:"
        echo "   ssh $WORKER_HOST"
        echo "   sshfs $MASTER_USER@$MASTER_IP:$MASTER_PATH ~/learnPhotos_mount"
    }
else
    echo "   Preskočeno. Mount-aj ročno z ukazom zgoraj."
fi

# Korak 5: Preveri mount
echo ""
echo "5. Preverjam mount..."
if ssh $WORKER_HOST "test -d $WORKER_MOUNT_POINT && ls $WORKER_MOUNT_POINT >/dev/null 2>&1"; then
    echo "   ✅ Mount deluje!"
    ssh $WORKER_HOST "ls -la $WORKER_MOUNT_POINT | head -5"
else
    echo "   ⚠️  Mount morda ne deluje. Preveri ročno."
fi

echo ""
echo "=== Nastavitev končana ==="
echo ""
echo "Za unmount uporabi:"
echo "  ssh $WORKER_HOST 'fusermount -u ~/learnPhotos_mount'  # Linux"
echo "  ssh $WORKER_HOST 'umount ~/learnPhotos_mount'          # macOS"
