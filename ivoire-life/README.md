# Ivoire Life 🇨🇮

Un jeu de simulation de vie à la *Sims*, sur la vraie carte de la Côte d'Ivoire.
Crée ton Sim, installe-toi à Yopougon, Cocody ou Bouaké, gère ta faim, ton
énergie et ton porte-monnaie en FCFA, prends le woro-woro, mange un garba au
maquis… et laisse les évènements aléatoires pimenter ta vie.

| Partie | Stack | Hébergement |
|---|---|---|
| `backend/` | Go 1.25 · chi · pgx | Render (Docker) |
| `web/` | React 19 · TypeScript · Vite · Tailwind 4 · Mapbox GL | Vercel |
| Base de données | PostgreSQL | Neon |
| Connexion | Google Sign-In (ID token vérifié par l'API) | |

## Les écrans

1. **Accueil / connexion** (`/`) : titre du jeu et bouton « Continuer avec Google ». En local, un bouton « Jouer en local » permet de jouer sans Google.
2. **Créer un Sim** (`/creer`) : identité, apparence (teint, coiffure, pagne wax, boubou, maillot des Éléphants…), traits et aspiration, puis ville et commune de départ. L'aperçu de l'avatar se met à jour en direct.
3. **Le jeu** (`/jeu`) : la carte Mapbox de la Côte d'Ivoire, avec le HUD façon Sims (horloge du jeu, FCFA, humeur et jauges des besoins). On zoome du pays vers la ville, puis la commune, puis le lieu. Cliquer sur un lieu ouvre le **menu circulaire** des interactions. Les trajets se font en woro-woro (dans une ville) ou en car (entre deux villes). Un journal garde la trace de tout ce qui arrive.
4. **Profil** (`/profil`) : le compte Google, la fiche du Sim, les statistiques et le journal complet.

## Lancer en local

```bash
# 1. Base de données (ou mets directement ton URL Neon dans backend/.env)
docker compose up -d

# 2. API (http://localhost:8080)
cd backend
cp .env.example .env
go run ./cmd/api          # les migrations s'appliquent au démarrage

# 3. Front (http://localhost:5173)
cd ../web
cp .env.example .env      # ajoute VITE_MAPBOX_TOKEN et VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Sans `VITE_MAPBOX_TOKEN`, le jeu utilise une carte stylisée hors-ligne : mêmes
repères, mêmes mouvements de caméra. Sans `GOOGLE_CLIENT_ID`, mets
`DEV_LOGIN=true` côté API pour te connecter en mode dev.

Tests : `cd backend && go test ./...`

## Déploiement

1. **Neon** : crée un projet et copie la chaîne de connexion (`sslmode=require`).
2. **Google** : dans Google Cloud Console → *Credentials*, crée un *OAuth client ID* de type **Web**. Ajoute `http://localhost:5173` et l'URL Vercel dans *Authorized JavaScript origins*. Le même client ID va dans `GOOGLE_CLIENT_ID` (API) et `VITE_GOOGLE_CLIENT_ID` (web).
3. **Render** : *New → Blueprint* avec `render.yaml` (ou un *Web Service* Docker avec `backend/` comme dossier racine). Renseigne `DATABASE_URL`, `GOOGLE_CLIENT_ID` et `ALLOWED_ORIGINS` (URL Vercel). Ne mets **pas** `DEV_LOGIN`.
4. **Vercel** : importe le repo avec `web/` comme *Root Directory* (preset Vite). Variables : `VITE_API_URL=https://<ton-api>.onrender.com/api/v1`, `VITE_MAPBOX_TOKEN`, `VITE_GOOGLE_CLIENT_ID`. `vercel.json` renvoie toutes les routes vers l'app.

## Comment le jeu fonctionne

- **Le temps** : 1 seconde réelle = 1 minute de jeu, donc une journée dure 24 minutes. Quand tu n'es pas là, le temps avance au maximum de 3 heures de jeu.
- **Les besoins** (Faim, Énergie, Hygiène, Social, Loisirs) baissent à chaque heure de jeu. Leur moyenne donne la couleur du losange.
- **Les interactions** coûtent du temps et de l'argent (ou en rapportent : le travail, le petit commerce). Certaines ne sont possibles qu'à certaines heures, par exemple le maquis le soir et la boîte de nuit après 21 h.
- **Les évènements aléatoires** : après une action, il y a 35 % de chances qu'il se passe quelque chose (coupure de courant, un grand-frère qui paie la tournée, un gnambro qui te fait payer 100F de plus…).
- Le serveur décide de tout, et le front ne fait que prédire l'horloge et les jauges entre deux actions.

## Ajouter du contenu

- **Villes, communes et lieux** : `backend/internal/world/world.go`
- **Types de lieux, interactions et évènements** : `backend/internal/game/catalog.go`
- **Traits et aspirations** : `backend/internal/game/traits.go`
- **Règles** (vitesse du temps, baisse des besoins, chance d'évènement) : `backend/internal/game/needs.go` et `sim.go`. `web/src/game/rules.ts` reprend les mêmes constantes pour le HUD.

Un test vérifie que chaque lieu utilise un type qui existe et que tous les identifiants sont uniques.
