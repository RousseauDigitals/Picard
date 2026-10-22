[README.md](https://github.com/user-attachments/files/33831024/README.md)
# Ajouter les données de conjugaison

Le moteur et l'interface sont prêts, mais la base est volontairement vide : le PDF reçu est un scan photographique et les tableaux de conjugaison n'ont pas encore été transcrits. Le site ne doit pas inventer des formes et les présenter comme celles de René Debrie.

Chaque verbe est un objet dans `verbs.json` :

```json
{
  "infinitive": "FORME EXACTE DE L'INFINITIF",
  "variants": [],
  "group": "Classe telle que définie par le livre",
  "definition": "Sens ou remarque facultative, uniquement si sourcé",
  "conjugations": {
    "Indicatif": {
      "Présent": ["forme 1", "forme 2", "forme 3", "forme 4", "forme 5", "forme 6"],
      "Imparfait": ["forme 1", "forme 2", "forme 3", "forme 4", "forme 5", "forme 6"]
    }
  },
  "notes": "Exceptions / variantes attestées",
  "source": "Page(s) du livre"
}
```

- Les tableaux doivent contenir les formes dans l'ordre des six personnes : 1re singulier, 2e singulier, 3e singulier, 1re pluriel, 2e pluriel, 3e pluriel.
- Les noms de modes et de temps doivent reprendre la terminologie du livre.
- Les temps composés peuvent être saisis comme un tableau de formes complètes si c'est ainsi que le livre les présente.
- `variants` sert aux graphies alternatives explicitement attestées.
- `group`, `definition`, `notes` et `source` sont des champs textuels ; ne pas y mettre d'information supposée.

## Dictionnaire français → picard (réservé)

L'emplacement d'interface est déjà dans `index.html`. Quand le module sera activé, créer par exemple `data/dictionary.json` et un fichier JS distinct pour ne pas mélanger dictionnaire et conjugueur. Schéma futur suggéré :

```json
{
  "entries": [
    { "fr": "mot français", "picard": ["forme attestée"], "region": "variété", "source": "page" }
  ]
}
```

Ce schéma est une proposition technique, pas une transcription du livre.
