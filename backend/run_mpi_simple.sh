#!/bin/bash
# Enostavna skripta za zagon MPI

VIDEO_PATH="$1"
USERNAME="$2"

if [ -z "$VIDEO_PATH" ] || [ -z "$USERNAME" ]; then
    echo "Uporaba: $0 <video_path> <username>"
    exit 1
fi

# Absolutna pot do videa
if [ ! -f "$VIDEO_PATH" ]; then
    ABS_VIDEO="/Users/blazbracko/Documents/HLA/healthy-lifestyle-app/backend/$VIDEO_PATH"
    if [ -f "$ABS_VIDEO" ]; then
        VIDEO_PATH="$ABS_VIDEO"
    fi
fi

# Kopiraj video na worker
VIDEO_BASENAME=$(basename "$VIDEO_PATH")
echo "Kopiram video na worker..."
scp "$VIDEO_PATH" valbracko@192.168.50.244:~/hla_backend/ 2>/dev/null || true

# Zaženi MPI - uporabi relativno pot, ker se izvaja iz hla_backend
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 /Users/blazbracko/hla_backend/dataSet_mpi.py "$VIDEO_PATH" "$USERNAME"
