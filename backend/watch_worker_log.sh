#!/bin/bash
# Skripta za spremljanje worker log datoteke na worker računalniku

USERNAME="${1:-testuser}"
WORKER_HOST="valbracko@192.168.50.244"
LOG_DIR="~/hla_backend/logs"

echo "Spremljam worker log datoteke za uporabnika: $USERNAME"
echo "Na worker računalniku: $WORKER_HOST"
echo ""
echo "Zaustavi s Ctrl+C"
echo ""

# Poišči najnovejšo log datoteko
ssh $WORKER_HOST "tail -f \$(ls -t $LOG_DIR/worker_*_${USERNAME}.log 2>/dev/null | head -1) 2>/dev/null || echo 'Log datoteka še ne obstaja. Počakaj, da se MPI zažene...'"
