FROM node:16

# Nastavimo delovni imenik
WORKDIR /usr/src/app

# Kopiramo package.json in package-lock.json
COPY package*.json ./

# Namestimo odvisnosti
RUN npm install

# Kopiramo vse datoteke projekta v delovni imenik
COPY . .

# Sestavimo projekt
RUN npm run build

# Izpostavimo vrata, na katerih aplikacija teče
EXPOSE 3000

# Ukaz za zagon aplikacije 
CMD ["npm", "start"]