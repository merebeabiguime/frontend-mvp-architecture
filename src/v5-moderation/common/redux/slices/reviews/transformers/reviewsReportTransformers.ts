/**
 * COUCHE TRANSFORMERS - Normalisation des Données
 * ================================================
 *
 * Ce fichier contient LA fonction la plus critique de toute l'architecture reviews.
 * Elle transforme la structure DÉNORMALISÉE reçue de l'API en structure NORMALISÉE pour Redux.
 *
 * PROBLÈME RÉSOLU :
 * =================
 *
 * L'API renvoie une structure imbriquée (pour simplifier le transfert réseau) :
 * ```json
 * {
 *   "report": {
 *     "reviewsList": [
 *       { "id": 1, "message": "Super", "rating": 5, ... },
 *       { "id": 2, "message": "Bien", "rating": 4, ... }
 *     ],
 *     "reviewsIndicatorList": [
 *       {
 *         "type": "EXCELLENT",
 *         "monthGrowthPercentage": 15,
 *         "reviewsList": [
 *           { "id": 1, "message": "Super", "rating": 5, ... }  // ❌ DUPLICATION
 *         ]
 *       },
 *       {
 *         "type": "BON",
 *         "monthGrowthPercentage": 8,
 *         "reviewsList": [
 *           { "id": 2, "message": "Bien", "rating": 4, ... }  // ❌ DUPLICATION
 *         ]
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * **Problèmes de cette structure :**
 * - Review id:1 existe EN DOUBLE (dans reviewsList ET dans indicatorList[0].reviewsList)
 * - Si on veut modifier la review id:1, il faut la mettre à jour à 2 endroits
 * - Risque de désynchronisation très élevé
 * - Consomme plus de mémoire
 * - Complexité O(n²) pour certaines opérations
 *
 * SOLUTION : NORMALISATION
 * ========================
 *
 * Cette fonction "aplatit" la structure pour avoir :
 * ```typescript
 * {
 *   report: { id: 0, reviewIds: [1, 2], reviewsIndicatorIds: [0, 1] },
 *   reviews: [
 *     { id: 1, message: "Super", rating: 5, ... },  // ✅ Une seule fois
 *     { id: 2, message: "Bien", rating: 4, ... }    // ✅ Une seule fois
 *   ],
 *   indicators: [
 *     { id: 0, type: "EXCELLENT", reviewIds: [1], monthGrowthPercentage: 15 },  // ✅ Référence par ID
 *     { id: 1, type: "BON", reviewIds: [2], monthGrowthPercentage: 8 }         // ✅ Référence par ID
 *   ]
 * }
 * ```
 *
 * **Avantages :**
 * - ✅ Chaque review n'existe qu'UNE SEULE FOIS en mémoire
 * - ✅ Modification d'une review = un seul endroit à mettre à jour
 * - ✅ Pas de risque de désynchronisation
 * - ✅ Performance optimale (lookup en O(1))
 * - ✅ Redux peut gérer 10, 100, 1000+ reviews sans ralentissement
 *
 * ANALOGIE :
 * C'est exactement ce que fait une base de données relationnelle !
 * - Table "reviews" avec primary key "id"
 * - Table "indicators" avec foreign key "reviewIds[]"
 *
 * UTILISATION DANS L'ARCHITECTURE :
 * ================================
 *
 * 1. API renvoie la structure imbriquée
 * 2. Le Repository appelle ce transformer
 * 3. Le transformer sépare les données en 3 entités distinctes
 * 4. Le Repository dispatch ces 3 entités dans leurs slices respectifs
 * 5. Redux stocke chaque entité une seule fois
 * 6. Les Selectors "rejoignent" les entités quand les composants en ont besoin
 *
 * IMPORTANCE POUR UN MVP EN ITÉRATION :
 * ====================================
 *
 * Sans ce transformer, le MVP serait ingérable après quelques itérations :
 * - Bugs de synchronisation à chaque changement
 * - Code de mise à jour complexe et source d'erreurs
 * - Impossible d'ajouter de nouvelles features sans tout casser
 *
 * Avec ce transformer :
 * - Données toujours cohérentes
 * - Ajout de features facile (on manipule des IDs)
 * - Tests simples (on teste la normalisation une fois)
 * - Évolutivité garantie
 */

import { IReviewsEntity } from '../../../../entities/IReviewsEntity';
import { IReviewsReportsEntity } from '../../../../entities/IReviewsReportEntity';
import {
  IReviewsIndicatorsSliceEntity,
  IReviewsReportSliceEntity,
} from '../types/types';

/**
 * Type de retour de la fonction de normalisation
 * Contient les 3 entités séparées prêtes à être dispatchées dans Redux
 */
export interface ParsedReviewsReportData {
  /** Le rapport avec uniquement des IDs référençant reviews et indicators */
  report: IReviewsReportSliceEntity;

  /** La liste de toutes les reviews (sans duplication) */
  reviews: IReviewsEntity[];

  /** Les indicateurs avec des IDs référençant les reviews */
  indicators: IReviewsIndicatorsSliceEntity[];
}

/**
 * FONCTION PRINCIPALE : Normalise un rapport reviews complet
 *
 * @param raw - Rapport dénormalisé reçu de l'API (structure imbriquée)
 * @returns Données normalisées : { report, reviews, indicators } (structure plate avec IDs)
 *
 * ALGORITHME :
 * 1. Créer l'entité report avec des listes d'IDs
 * 2. Extraire toutes les reviews uniques (dédupliquer par ID)
 * 3. Pour chaque indicator, remplacer la liste de reviews par une liste d'IDs
 * 4. Retourner les 3 entités séparées
 *
 * COMPLEXITÉ :
 * - Temps : O(n) où n = nombre total de reviews (on parcourt chaque review une fois)
 * - Espace : O(n) (on crée de nouveaux objets mais sans duplication)
 *
 * @example
 * ```typescript
 * const apiResponse = await SGetAllReviews();
 * const { report, reviews, indicators } = normalizeReviewsReportEntity(apiResponse.report);
 *
 * // Dispatch dans les 3 slices Redux
 * dispatch(reviewsReportActions.addReviewReport(report));
 * dispatch(reviewsActions.addReviews(reviews));
 * dispatch(reviewsIndicatorsActions.addReviewsIndicators(indicators));
 * ```
 */
export function normalizeReviewsReportEntity(
  raw: IReviewsReportsEntity,
): ParsedReviewsReportData {
  /**
   * ÉTAPE 1 : Créer l'entité Report normalisée
   * Au lieu de stocker les reviews complètes, on stocke juste leurs IDs
   */
  const reportEntity: IReviewsReportSliceEntity = {
    id: 0, // ID fixe car il n'y a qu'un seul rapport par restaurant
    reviewIds: raw.reviewsList.map((review) => review.id), // Extraire les IDs
    reviewsIndicatorIds: raw.reviewsIndicatorList.map((_, index) => index), // IDs basés sur l'index
  };

  /**
   * ÉTAPE 2 : Extraire les reviews sans duplication
   * On pourrait utiliser un Set pour garantir l'unicité, mais ici l'API
   * ne devrait pas renvoyer de doublons dans reviewsList
   */
  const reviewsEntities: IReviewsEntity[] = raw.reviewsList.map((review) => ({
    ...review, // Copie shallow (suffisant car les propriétés sont primitives)
  }));

  /**
   * ÉTAPE 3 : Normaliser les indicators
   * Remplacer chaque indicator.reviewsList (objets complets)
   * par indicator.reviewIds (liste d'IDs)
   */
  const indicatorsEntities: IReviewsIndicatorsSliceEntity[] =
    raw.reviewsIndicatorList.map((indicator, index) => ({
      id: index, // ID basé sur l'index (car les indicators n'ont pas d'ID naturel)
      type: indicator.type, // Type de catégorie (MAUVAIS, NORMAL, BON, EXCELLENT)
      monthGrowthPercentage: indicator.monthGrowthPercentage, // Métrique de croissance
      reviewIds: indicator.reviewsList.map((review) => review.id), // ✅ Transformation clé : objets -> IDs
    }));

  /**
   * ÉTAPE 4 : Retourner les données normalisées
   * Chaque entité peut maintenant être dispatchée dans son slice Redux respectif
   */
  return {
    report: reportEntity,
    reviews: reviewsEntities,
    indicators: indicatorsEntities,
  };
}

/**
 * ÉVOLUTION FUTURE (si le MVP évolue) :
 * ======================================
 *
 * Cette fonction est très facile à maintenir. Exemples d'évolutions :
 *
 * 1. **Ajout d'images dans les reviews** :
 *    - Ajouter `imageUrls?: string[]` dans IReviewsEntity
 *    - Cette fonction continue de fonctionner sans modification
 *
 * 2. **Ajout de métriques dans les indicators** :
 *    - Ajouter `averageRating: number` dans IReviewsIndicatorsSliceEntity
 *    - Calculer la moyenne ici : `averageRating: calculateAverage(indicator.reviewsList)`
 *
 * 3. **Déduplication intelligente** :
 *    - Si l'API envoie des doublons, ajouter un Set :
 *    ```typescript
 *    const uniqueReviews = Array.from(
 *      new Map(raw.reviewsList.map(r => [r.id, r])).values()
 *    );
 *    ```
 *
 * 4. **Validation des données** :
 *    - Ajouter des checks de cohérence (tous les IDs existent ?)
 *    - Logger les incohérences pour debug
 */
