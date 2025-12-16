#!/usr/bin/env python3
"""
Test skripta za preverjanje MPI povezave med master in worker računalniki.
"""

from mpi4py import MPI
import socket
import os
import sys
import json

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()
hostname = socket.gethostname()

# Preveri, ali je learnPhotos direktorij dostopen
learn_photos_exists = os.path.exists('learnPhotos')
learn_photos_writable = os.access('learnPhotos', os.W_OK) if learn_photos_exists else False

# Preveri, ali je trenutni direktorij pravilen
current_dir = os.getcwd()
script_dir = os.path.dirname(os.path.abspath(__file__))

info = {
    "rank": rank,
    "size": size,
    "hostname": hostname,
    "current_dir": current_dir,
    "script_dir": script_dir,
    "learnPhotos_exists": learn_photos_exists,
    "learnPhotos_writable": learn_photos_writable,
    "python_version": sys.version.split()[0]
}

print(json.dumps(info), flush=True)

# Test komunikacije
if rank == 0:
    # Master pošlje sporočilo vsem workerjem
    message = f"Hello from master (rank {rank})"
    for i in range(1, size):
        comm.send(message, dest=i, tag=0)
        print(json.dumps({
            "status": "sent",
            "from": rank,
            "to": i,
            "message": message
        }), flush=True)
    
    # Prejme odgovore
    for i in range(1, size):
        response = comm.recv(source=i, tag=1)
        print(json.dumps({
            "status": "received",
            "from": i,
            "response": response
        }), flush=True)
else:
    # Worker prejme sporočilo
    message = comm.recv(source=0, tag=0)
    response = f"Worker {rank} ({hostname}) received: {message}"
    comm.send(response, dest=0, tag=1)
    print(json.dumps({
        "status": "responded",
        "rank": rank,
        "hostname": hostname,
        "message": message
    }), flush=True)

if rank == 0:
    print(json.dumps({"status": "test_completed"}), flush=True)
