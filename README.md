## Requirements

### Create a temporary directory:

```
mkdir tmp
```

### Copy your main Skype DB

```
cp ~/.Skype/[skypename]/main.db tmp/
```

NOTE:

If you feel brave enough you can point to your live Skype DB (i. e. ignore the 2 steps above). The database is only read
with a fairly simple select statement (no inserts, updates, deletes), but this module has not been extensively tested.

Do this at your on risk.

## Run

```
npm install
```

```
node lib/wakatime-skype.js ./tmp/main.db
```
## TODO

- run as daemon