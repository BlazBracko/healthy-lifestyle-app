FROM node:16

# Nastavite delovni imenik
WORKDIR /usr/src/app

# Kopirajte package.json in package-lock.json
COPY package*.json ./

# Namestite odvisnosti
RUN npm install

# Kopirajte vse datoteke projekta v delovni imenik
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Ukaz za zagon aplikacije
CMD ["node", "app.js"]
