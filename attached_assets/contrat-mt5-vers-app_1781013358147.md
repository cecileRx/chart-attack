# Contrat d'interface — Remontée des résultats MT5 → ChartAttack

> À donner à l'agent Replit pour implémenter le **côté app**.
> Le côté EA (MQL5) est géré séparément. Ce document fige le contrat commun.

## Flux global
```
1. App  : "Export EA Plan" → CSV avec l'id de l'analyse (8e champ)
2. EA   : lit l'id, le stocke dans le COMMENTAIRE de l'ordre
3. EA   : à la clôture totale → calcule R réel + niveau de sortie
4. EA   : POST /api/ingest/outcome   (auth X-API-Key)
5. App  : mappe clé→userId, écrit exit + realized_r sur l'analyse {id}
6. UI   : History affiche le R EXACT (realized_r écrase le R modélisé)
```

## Décisions figées
- **Domaine** : `https://chartattack.net`
- **Stockage clé API** : hash **SHA-256** (jamais la clé en clair en base)
- **Colonnes DB** : `exit` et `realized_r` existent DÉJÀ (rien à migrer).
- **UI** : lit déjà `realized_r` via `entryR()` → aucune modif d'affichage nécessaire.

---

## Interface 1 — CSV du plan (App → EA)
Ajouter l'`id` de l'analyse comme **8ᵉ champ** de la ligne de données :
```
# ChartAttack EA plan: symbol,direction,entry,sl,tp1,tp2,tp3,id
BTCUSD,SELL,63320,63420,63220,63120,63020,a1b2c3d4e5f6a7b8
```
- `id` = celui posé par le backend (`analyzeChart.ts:291`, 16 hex).
- Rétrocompatible : si absent (non connecté), l'EA trade mais ne remonte rien.

**Côté app (Replit)** : modifier le handler "Export EA Plan" pour écrire `currentPlan.id` en 8ᵉ colonne (et l'ajouter à la ligne d'en-tête `#`).

---

## Interface 2 — Endpoint d'ingestion (EA → App)
```
POST  https://chartattack.net/api/ingest/outcome
Headers:
  Content-Type: application/json
  X-API-Key: ca_<clé>           ← PAS Clerk
Body:
{
  "id":        "a1b2c3d4e5f6a7b8",     // requis
  "exit":      "TP2",                  // requis — SL|BE|TP1|TP2|TP3
  "realizedR": 1.12,                   // requis — R exact = profit / risque_1R
  "profit":    56.30,                  // optionnel — devise du compte
  "symbol":    "BTCUSD",               // optionnel
  "closedAt":  "2026-06-09T13:47:00Z"  // optionnel — ISO 8601
}
```
**Réponses** : `200 {"success":true}` · `401` clé invalide · `404` id introuvable pour ce user · `400` payload invalide.

**Côté app (Replit)** :
- middleware auth par `X-API-Key` (hash SHA-256 de la clé reçue → lookup → `user_id`) ;
- `UPDATE analyses SET exit=?, realized_r=? WHERE id=? AND user_id=?` (vérifier la propriété) ;
- valider `exit ∈ {SL,BE,TP1,TP2,TP3}` et `realizedR` number ;
- l'endpoint NE doit PAS être gated Clerk (route séparée du reste).

---

## Interface 3 — Clé API (auth machine)
- Table `api_keys (id, user_id, key_hash, label, created_at, last_used_at)`.
- **Génération** : `POST /api/keys` (auth Clerk) → renvoie `ca_<32 hex>` **une seule fois** ; stocker le **hash SHA-256**.
- **Validation ingest** : SHA-256 de la clé reçue → lookup → `user_id` ; mettre à jour `last_used_at`.
- **UI** : écran "Réglages → Clé API MT5" avec bouton *Générer* + affichage unique de la clé à copier.
- La clé se colle dans l'input `InpApiKey` de l'EA.

---

## Détails MT5 (côté EA — déjà en cours, hors Replit)
- `WebRequest()` exige de whitelister l'URL dans MT5 : Outils → Options → Expert Advisors → *Autoriser WebRequest pour* `https://chartattack.net`.
- L'EA stocke l'`id` dans le commentaire de l'ordre à l'ouverture.
- À la clôture totale (`OnTradeTransaction`, `DEAL_ENTRY_OUT`) : somme des profits des deals (partiels + swap + commission) ÷ risque_1R → `realizedR`.
- `exit` dérivé du `stage` max atteint (fallback : seuils sur le R).
- Pas d'`id` → pas de remontée. Échec WebRequest → fallback fichier `chartattack_result.csv`.

---

## Cas limites figés
| Cas | Comportement |
|---|---|
| Analyse non sauvée (pas d'id) | EA trade, ne remonte pas |
| Plusieurs partiels | 1 seul POST, à la clôture totale (R = somme des profits) |
| Re-report du même id | Last-write-wins (l'app écrase) |
| Trade manuel (magic 0) | Pas d'id → pas de remontée |
| Clé absente/fausse | EA log l'erreur, n'altère rien côté app |

---

## Répartition
- **Replit (app)** : id dans l'export CSV · `POST /api/ingest/outcome` · table `api_keys` + `POST /api/keys` + écran Réglages clé API.
- **EA (MQL5)** : id dans le commentaire · calcul R réel · dérivation exit · POST WebRequest + fallback fichier.
