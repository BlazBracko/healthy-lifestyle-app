# Namestitev OpenMPI na worker računalniku

## Worker računalnik: valbracko@192.168.50.244
- OS: macOS 15.3 (arm64)
- Python: 3.9.6 ✅
- mpi4py: nameščen ✅
- OpenMPI: **MANJKA** ❌

## Korak 1: Namesti Homebrew (če še ni nameščen)

**Na worker računalniku** (direktno ali preko SSH):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Po namestitvi dodaj Homebrew v PATH:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Preveri:
```bash
brew --version
```

## Korak 2: Namesti OpenMPI

```bash
brew install openmpi
```

To bo nameščilo:
- `mpirun` (MPI launcher)
- `mpicc`, `mpic++` (MPI compilers)
- OpenMPI library

Preveri:
```bash
which mpirun
mpirun --version
```

## Korak 3: Preveri, ali mpi4py deluje z OpenMPI

```bash
python3 -c "from mpi4py import MPI; print('MPI version:', MPI.Get_version())"
```

## Korak 4: Testiraj MPI na worker

```bash
# Preveri, ali lahko zaženeš osnovni MPI program
mpirun -np 1 python3 -c "from mpi4py import MPI; comm = MPI.COMM_WORLD; print(f'Rank {comm.Get_rank()}/{comm.Get_size()}')"
```

## Alternativna metoda (če Homebrew ne deluje)

Če Homebrew ne deluje, lahko namestiš OpenMPI preko conda ali direktno iz source:

### Preko conda (če imaš conda/miniconda):
```bash
conda install -c conda-forge openmpi
```

### Preko pip (omejeno):
```bash
# OpenMPI mora biti nameščen preko Homebrew ali conda
# pip samo namesti Python wrapper
pip3 install mpi4py
```

## Po namestitvi

Ko je OpenMPI nameščen, zaženi test:

```bash
# Na master računalniku:
cd backend
./quick_test_mpi.sh
```

Ali direktno:
```bash
cd backend
# OpenMPI 5.x na macOS: uporabi colon syntax namesto --hostfile
mpirun -np 2 -H localhost:1,valbracko@192.168.50.244:1 python3 test_mpi.py
```
