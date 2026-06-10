# Brief Replit — Validation des niveaux (anti-plans aberrants)

> À donner à l'agent Replit. Objectif : empêcher ChartAttack de produire/exporter
> des plans aux niveaux incohérents (ex. SL de 7% sur l'Or, TP à 21%).

## Problème observé
L'IA-vision a sorti pour XAUUSD : `entry 4176 / SL 4476 / TP1 3876 / TP2 3576 / TP3 3276`.
→ SL à **300$ ≈ 7.2% du prix**, TP3 à **21%**. Niveaux « macro » absurdes pour un trade.
L'EA a tradé ça (lot minuscule forcé par le SL géant). Le code dérive TP1/2/3 = 1R/2R/3R,
donc **toute l'aberration vient du SL choisi par l'IA**.

## Donnée déjà disponible
La réponse d'analyse contient déjà **`priceMin` et `priceMax`** = la plage de prix visible
du graphique analysé. C'est la vérité terrain pour valider : des niveaux hors de cette plage
sont forcément faux.

## Règles de validation (à appliquer côté serveur, après parsing de la réponse IA)
Dans `artifacts/api-server/src/routes/analyzeChart.ts`, juste après avoir parsé l'objet `plan`
de l'IA et AVANT de le renvoyer/persister, calculer des `warnings` :

```
const range = priceMax - priceMin;            // plage visible
const slDist = Math.abs(entry - sl);
const warnings = [];

// 1. Niveaux hors de la plage visible (marge de 10% tolérée)
const lo = priceMin - 0.1 * range;
const hi = priceMax + 0.1 * range;
for (const [name, v] of [["sl",sl],["tp1",tp1],["tp2",tp2],["tp3",tp3]]) {
  if (v < lo || v > hi) warnings.push(`${name} (${v}) hors de la plage visible [${priceMin}, ${priceMax}]`);
}

// 2. SL trop large en % du prix (seuil tunable, défaut 2%)
if (entry > 0 && slDist / entry > 0.02)
  warnings.push(`SL à ${(slDist/entry*100).toFixed(1)}% du prix (> 2%) — probablement mal calibré`);

// 3. SL trop large vs la plage visible (défaut 40%)
if (range > 0 && slDist > 0.4 * range)
  warnings.push(`distance SL (${slDist}) > 40% de la plage visible (${range})`);

// 4. Cohérence directionnelle
const isBuy = direction === "BUY";
const ordered = isBuy ? (sl < entry && entry < tp1 && tp1 < tp2 && tp2 < tp3)
                      : (sl > entry && entry > tp1 && tp1 > tp2 && tp2 > tp3);
if (!ordered) warnings.push("ordre des niveaux incohérent avec la direction");
```

Attacher au plan renvoyé : `plan.levelWarnings = warnings;` (champ optionnel, array de strings).
Ajouter `levelWarnings?: string[]` au schéma de réponse (OpenAPI) + au type `TradePlan`.

## Comportement en cas d'incohérence (UX)
NE PAS bloquer l'affichage — l'utilisateur doit voir ce que l'IA a proposé. Mais :
1. **Bannière d'avertissement** rouge dans `ResultsPanel.tsx` listant les `levelWarnings`.
2. **Désactiver le bouton « Export EA Plan »** tant qu'il y a des warnings
   (sinon un plan aberrant part dans MT5 et trade pour de vrai).
3. Proposer de **basculer en mode manuel** (`ManualLevelsPanel`) pour corriger les niveaux —
   et là, recalculer la validation à la volée (lever les warnings une fois corrigé).

## Durcir le prompt vision (réduire la source du problème)
Dans le prompt envoyé au modèle vision, ajouter une contrainte explicite, du type :
> « Le SL et les TP DOIVENT être cohérents avec les bougies VISIBLES sur le graphique
> (intraday), pas des niveaux macro. La distance entry↔SL doit rester dans une fourchette
> réaliste (typiquement 0.1%–1.5% du prix). Ne propose pas de niveaux hors de la plage de
> prix affichée. »

## Seuils (tunables — valeurs de départ)
- SL max en % du prix : **2%**
- SL max vs plage visible : **40%**
- Marge hors-plage tolérée : **10%**

(À ajuster selon le comportement réel ; commencer prudent.)

## Note importante — périmètre
Ce garde-fou est du **contrôle qualité** : il élimine les plans absurdes, il ne rend PAS
le signal rentable. La question de l'edge reste tranchée par le **tracker d'expectancy en R**,
pas par cette validation. Les deux sont utiles mais distincts.
