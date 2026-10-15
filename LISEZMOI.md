# Mise à jour (version 4)

1. **Règles Firebase** : remplace-les par le contenu de `firebase-rules.json` (Realtime Database > Règles > Publier). Obligatoire : il y a de nouveaux champs (rôles, drive, office, maintenance…).
2. Envoie TOUS les fichiers sur GitHub (garde ton `config.js` ou régénère-le avec `config.html`).
3. Ouvre `config.html` pour tester ta configuration (clé, authentification, base verrouillée).
4. Première installation : ouvre `setup.html`, puis supprime-le du dépôt.
   Déjà installé : rien à refaire, tes comptes restent valides. Les anciens « membre » sont des « lecteur ».

## Rôles
- **Lecteur** : consulte, chat/mail/drive selon ses accès. **Éditeur** : ajoute nouvelles, événements, tâches, fichiers drive. **Admin** : tout.
- Changer le rôle d'un compte demande un nouveau code (6 chiffres lecteur/éditeur, 10 chiffres admin) : plus de blocage à la connexion.
- Le compte **Backup** est inchangeable (code, rôle, suppression bloqués par les règles).

## Options à configurer (dans config.js, via config.html)
- Google en un clic : ID client OAuth + origine autorisée.
- E-mails (nouvelles, tâches, code oublié) : compte gratuit EmailJS.

## Limites
- Pas de « clé d'accès » (passkey) : impossible sans serveur. Utilise la connexion Google + le trousseau Apple/Google de ton téléphone.
- Blocage d'IP « souple » (contournable par VPN) ; le blocage de compte, lui, est strict.
- Fichiers stockés dans la base : 3 Mo max chacun.
