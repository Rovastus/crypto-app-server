### Run docker containers

```
run DB via docker-compose.yml
```

### Adminer

```
http://localhost:8085/?pgsql=postgresql&username=crypto&db=cryptodatabase
Password: cryptoPassword
```

### Generate prisma releted files

```
yarn -s prisma generate
yarn -s prisma migrate reset --preview-feature
yarn -s prisma migrate dev
```

### Run server

```
yarn && yarn dev
```

### Database model

![DB model](./docs/database.png)
