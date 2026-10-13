# Installation sécurisée (Firebase Authentication + règles)

## Pourquoi l'ancienne version était faille
Les PIN étaient stockés en clair dans la base et la base était ouverte à tous : quiconque trouvait l'URL Firebase dans le code pouvait lire tous les PIN. Cette version n'a plus aucun PIN dans la base : les codes sont vérifiés par Firebase Authentication, et des règles serveur limitent ce que chacun peut lire ou écrire.

## Étapes (≈10 min)
1. **Supprime l'ancienne base** : Realtime Database > ⋮ > supprimer toutes les données (les anciens PIN y sont lisibles). Considère les anciens PIN comme compromis.
2. **Authentication** > Méthode de connexion > active **E-mail/Mot de passe**.
3. **Paramètres du projet** > Vos applications > ajoute une app Web (</>) et copie `apiKey`. Copie aussi l'URL de la Realtime Database.
4. **Realtime Database > Règles** : colle le contenu de `firebase-rules.json` puis Publier.
5. Remplis `config.js` (apiKey, url, et optionnellement la clé Giphy).
6. Envoie tous les fichiers sur GitHub Pages, ouvre `setup.html`, choisis les codes Admin et Backup (10 chiffres). Les codes des 7 membres s'affichent une seule fois : note-les.
7. **Supprime `setup.html`** du dépôt.
8. Recommandé : Google Cloud Console > Identifiants > ta clé API > restrictions HTTP referrers = l'adresse de ton site.

## Limites à connaître
- Un code de 6 chiffres reste faible face à quelqu'un qui essaie des milliers de combinaisons ; Firebase limite les essais, mais utilise 10 chiffres pour les comptes sensibles.
- Les messages privés sont invisibles pour les autres membres et pour l'admin du site, mais pas pour le propriétaire du projet Firebase.
- Les fichiers sont stockés dans la base (max 3 Mo chacun).
