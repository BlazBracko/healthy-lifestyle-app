#!/bin/bash
# Hitri test MPI povezave

echo "=== Preverjanje SSH povezave ==="
if ssh -o ConnectTimeout=5 valbracko@192.168.50.244 "echo 'SSH OK' && hostname" 2>/dev/null; then
    echo "✅ SSH povezava deluje"
else
    echo "❌ SSH povezava ne deluje!"
    echo "Preveri:"
    echo "  1. Ali je worker računalnik vklopljen in na omrežju"
    echo "  2. Ali je SSH strežnik zagnan na worker računalniku"
    echo "  3. Nastavi SSH ključ z: ssh-copy-id valbracko@192.168.50.244"
    exit 1
fi

echo ""
echo "=== Preverjanje MPI na master ==="
which mpirun || { echo "❌ mpirun ni nameščen!"; exit 1; }
python3 -c "import mpi4py" || { echo "❌ mpi4py ni nameščen!"; exit 1; }

echo ""
echo "=== Preverjanje MPI na worker ==="
if ssh valbracko@192.168.50.244 "which mpirun 2>/dev/null || [ -f /opt/homebrew/bin/mpirun ] && /opt/homebrew/bin/mpirun --version && python3 -c 'import mpi4py'" 2>/dev/null; then
    echo "✅ MPI nameščen na worker"
else
    echo "⚠️  Preverjam MPI na worker..."
    ssh valbracko@192.168.50.244 "/opt/homebrew/bin/mpirun --version 2>/dev/null && python3 -c 'import mpi4py'" || {
        echo "❌ MPI ni nameščen na worker računalniku!"
        exit 1
    }
fi

echo ""
echo "=== Preverjanje hostfile.txt ==="
if [ ! -f "hostfile.txt" ]; then
    echo "❌ hostfile.txt ne obstaja!"
    exit 1
fi
cat hostfile.txt

echo ""
echo "=== Preverjanje direktorijev ==="
if [ ! -d "learnPhotos" ]; then
    echo "⚠️  learnPhotos direktorij ne obstaja, ustvarjam..."
    mkdir -p learnPhotos
fi
ls -ld learnPhotos

echo ""
echo "=== Zagon MPI testa ==="
# OpenMPI 5.x na macOS: uporabi colon syntax namesto --hostfile
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 test_mpi.py

echo ""
echo "✅ Test končan!"
