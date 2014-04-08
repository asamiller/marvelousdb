First, add your API key.

Then run:

```
node import.js
```

This will add the comics and characters to the DB.

Next, comment out these lines:

```
addComics();
addCharacters();
```
And uncomment :

```
appearsIn();
```

This will create the graph connections between the characters and the comics.