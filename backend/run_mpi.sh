#!/bin/bash
# Skripta za zagon MPI z pravilnimi potmi

# Preveri argumente
if [ $# -lt 2 ]; then
    echo "Uporaba: $0 <video_path> <username>"
    echo "Primer: $0 uploads/test_video.mp4 testuser"
    exit 1
fi

VIDEO_PATH="$1"
USERNAME="$2"

# Absolutne poti
MASTER_DIR="/Users/blazbracko/hla_backend"
WORKER_DIR="/Users/valbracko/hla_backend"

# Preveri, ali video obstaja
if [ ! -f "$VIDEO_PATH" ]; then
    # Poskusi z absolutno potjo
    ABS_VIDEO_PATH="/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/$VIDEO_PATH"
    if [ -f "$ABS_VIDEO_PATH" ]; then
        VIDEO_PATH="$ABS_VIDEO_PATH"
    else
        echo "Napaka: Video datoteka ne obstaja: $VIDEO_PATH"
        exit 1
    fi
fi

# Preveri, ali datoteke obstajajo
if [ ! -f "$MASTER_DIR/dataSet_mpi.py" ]; then
    echo "Napaka: dataSet_mpi.py ne obstaja v $MASTER_DIR"
    exit 1
fi

# Kopiraj video na worker (če je potrebno)
echo "Kopiram video na worker..."
scp "$VIDEO_PATH" valbracko@192.168.50.244:~/hla_backend/ 2>/dev/null || echo "Video že obstaja ali kopiranje ni potrebno"

# Določi pot do videa na worker
VIDEO_BASENAME=$(basename "$VIDEO_PATH")
WORKER_VIDEO_PATH="$WORKER_DIR/$VIDEO_BASENAME"

# Zaženi MPI z absolutno potjo
echo "Zaganjam MPI..."
cd "$MASTER_DIR"

# Uporabi absolutno pot do Python skripte
# Master bo uporabil: /Users/blazbracko/hla_backend/dataSet_mpi.py
# Worker mora uporabiti: /Users/valbracko/hla_backend/dataSet_mpi.py
# Vendar MPI uporablja isto pot za vse, zato moramo uporabiti relativno pot z -wdir

# Preveri, ali video obstaja na worker (kopiraj če ni)
WORKER_VIDEO_BASENAME=$(basename "$VIDEO_PATH")
ssh valbracko@192.168.50.244 "test -f ~/hla_backend/$WORKER_VIDEO_BASENAME || echo 'missing'" | grep -q "missing" && {
    echo "Kopiram video na worker..."
    scp "$VIDEO_PATH" valbracko@192.168.50.244:~/hla_backend/ 2>/dev/null
}

# Uporabi absolutno pot - MPI bo uporabil lokalno pot za vsak računalnik
mpirun -np 2 \
    -H localhost:1,valbracko@192.168.50.244:1 \
    python3 dataSet_mpi.py "$VIDEO_PATH" "$USERNAME"
