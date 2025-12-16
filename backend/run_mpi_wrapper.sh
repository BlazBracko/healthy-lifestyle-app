#!/bin/bash
# Wrapper skripta, ki se izvaja na vsakem računalniku

# Določi pot glede na hostname
HOSTNAME=$(hostname)

if [ "$HOSTNAME" = "Blazs-MacBook-Pro-3.local" ] || [ "$HOSTNAME" = "localhost" ]; then
    # Master računalnik
    SCRIPT_DIR="/Users/blazbracko/hla_backend"
    cd "$SCRIPT_DIR"
    python3 "$SCRIPT_DIR/dataSet_mpi.py" "$@"
else
    # Worker računalnik
    SCRIPT_DIR="/Users/valbracko/hla_backend"
    cd "$SCRIPT_DIR"
    python3 "$SCRIPT_DIR/dataSet_mpi.py" "$@"
fi
