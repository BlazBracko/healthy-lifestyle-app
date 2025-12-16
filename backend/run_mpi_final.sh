#!/bin/bash
# Končna skripta za zagon MPI

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

# Preveri, ali video obstaja
if [ ! -f "$VIDEO_PATH" ]; then
    echo "Napaka: Video datoteka ne obstaja: $VIDEO_PATH"
    exit 1
fi

# Absolutna pot
ABS_VIDEO_PATH=$(cd "$(dirname "$VIDEO_PATH")" && pwd)/$(basename "$VIDEO_PATH")

# Kopiraj video na worker
VIDEO_BASENAME=$(basename "$VIDEO_PATH")
echo "Kopiram video na worker..."
scp "$VIDEO_PATH" valbracko@192.168.50.244:~/hla_backend/ 2>/dev/null || true

# Zaženi MPI - uporabi python direktno z absolutno potjo
cd /Users/blazbracko/hla_backend
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 \
    python3 -c "
import sys
import os
import socket
from mpi4py import MPI

comm = MPI.COMM_WORLD
rank = comm.Get_rank()

# Določi pot glede na rank (rank 0 = master, rank > 0 = worker)
if rank == 0:
    script_path = '/Users/blazbracko/hla_backend/dataSet_mpi.py'
    video_path = '$ABS_VIDEO_PATH'
else:
    script_path = '/Users/valbracko/hla_backend/dataSet_mpi.py'
    video_basename = os.path.basename('$ABS_VIDEO_PATH')
    video_path = f'/Users/valbracko/hla_backend/{video_basename}'

# Preveri, ali datoteka obstaja
if not os.path.exists(script_path):
    print(f'ERROR: Script not found at {script_path} (rank {rank}, hostname {socket.gethostname()})', file=sys.stderr, flush=True)
    sys.exit(1)

sys.argv = ['dataSet_mpi.py', video_path, '$USERNAME']
exec(open(script_path).read())
" 2>&1
