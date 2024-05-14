# Healthy lifestyle app
## Vzpostavitev githuba v urejevalniku
- uporabljam vs Code, kar ni nujno, lahko je poljuben IDE
- -git clone URL
- -git branch (preveri na kerem branchu)
- -git checkout main
- -git pull
> **Warning**: URL je na githubu.



## Preveri status 
- git status<br /><br />
[Output: On branch main. Your branch is up to date with 'origin/main'.]
> **Warning**: Status mora biti vedno pred začetkom novega taska "Up to date".



## Ustvari nov branch (ime je tvoj task na JIRA)
- git checkout -b PM-1<br /><br />
[Output: Switched to a new branch 'PM-1'] <br />
<img width="307" alt="image" src="https://github.com/BlazBracko/PAC-MAN/assets/134056113/8fdd8c2b-6993-4fab-925c-08b56553a846"> <br />
<img width="872" alt="image" src="https://github.com/BlazBracko/PAC-MAN/assets/134056113/30539465-464b-484a-a990-75504c8d6cac"><br />

> **Warning**: Ime brancha kot je tu "PM-1" mora biti ime tvoje taska oz. jira issue key, kje se nahaja je razvidno na sliki.


# Redno preverjaj na katerem branchu si
- git branch<br />
[Output: * PM-1 <br />
          main ]
> **Warning**: Nikoli nič ne delaj na main branchu, redno preverjaj da si na svojem branchu.

# Stage vse spremembe
- git add --all

# Commitaj spremembe (obvezno Jira issue key)
- git commit -m "PM-1 Initial commit for feature"
> **Warning**: Spročilo commita je sestavljno iz "ISSUE-key spročilo" obezno pazi na poimenovanje commita, drugače jira ne bo povezana z tem commitom.

# Pushaj spremembe
- git push -u origin PM-1
> **Warning**: Pazi ime na koncu, tvoj jira issue key.

# Format commit spročil
- "PM-1 popravki-dizajna-labiritna"
> **Warning**: Za ISSUE-key daj presledek, na kratko opises kaj si naredil, presledke zamenjamo z znakom "-"



