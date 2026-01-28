/**
 * COUCHE SELECTORS - Dénormalisation des Données
 * ===============================================
 *
 * Les selectors font l'opération INVERSE du transformer :
 * - Transformer : Dénormalisé (API) → Normalisé (Redux)
 * - Selectors : Normalisé (Redux) → Dénormalisé (Composants)
 *
 * POURQUOI DÉNORMALISER POUR LES COMPOSANTS ?
 * ============================================
 *
 * **État dans Redux (normalisé) :**
 * ```typescript
 * {
 *   reviews: { entities: { 1: {...}, 2: {...} } },
 *   indicators: { entities: { 0: { type: 'EXCELLENT', reviewIds: [1] } } }
 * }
 * ```
 *
 * **Ce dont les composants ont besoin (dénormalisé) :**
 * ```typescript
 * {
 *   type: 'EXCELLENT',
 *   reviewsList: [{ id: 1, message: '...', rating: 5 }],  // Objets complets, pas juste des IDs
 *   monthGrowthPercentage: 15
 * }
 * ```
 *
 * Les composants ne veulent pas manipuler des IDs et faire des lookups manuels.
 * Ils veulent des objets prêts à afficher.
 *
 * MEMOIZATION AVEC createSelector :
 * ==================================
 *
 * `createSelector` de Reselect (inclus dans Redux Toolkit) est CRUCIAL pour la performance.
 *
 * **Sans memoization :**
 * ```typescript
 * const selectIndicators = (state) => {
 *   // ❌ Cette fonction s'exécute à CHAQUE render
 *   // ❌ Même si les données n'ont pas changé
 *   return Object.values(state.indicators.entities).map(indicator => ({
 *     ...indicator,
 *     reviewsList: indicator.reviewIds.map(id => state.reviews.entities[id])
 *   }));
 * };
 * ```
 * Problème : La dénormalisation est coûteuse (boucles, créations d'objets).
 * Si on la fait à chaque render, l'app ralentit.
 *
 * **Avec memoization (createSelector) :**
 * ```typescript
 * const selectIndicators = createSelector(
 *   [state => state.indicators, state => state.reviews],  // Dépendances
 *   (indicators, reviews) => { ... }  // Fonction de calcul
 * );
 * ```
 * Avantages :
 * - ✅ La fonction ne s'exécute QUE si indicators ou reviews changent
 * - ✅ Si aucun changement, le résultat précédent est retourné (cache)
 * - ✅ Évite les re-renders inutiles des composants
 * - ✅ Performance optimale même avec 1000+ reviews
 *
 * ARCHITECTURE EN COUCHES :
 * =========================
 *
 * Les selectors sont composés :
 * 1. selectDenormalizedReviews (reviews seules)
 * 2. selectDenormalizedReviewsIndicators (indicators + reviews) ← utilise (1)
 * 3. selectDenormalizedReviewsReports (report + indicators + reviews) ← utilise (1) et (2)
 *
 * Cette composition évite la duplication de code et améliore la réutilisabilité.
 *
 * IMPORTANCE POUR UN MVP :
 * ========================
 *
 * - Les composants restent SIMPLES (pas de logique de jointure)
 * - Facile d'ajouter de nouveaux selectors pour de nouvelles vues
 * - Performance garantie grâce à la memoization
 * - Type safety : TypeScript vérifie que les selectors retournent le bon type
 */

import { createSelector } from '@reduxjs/toolkit';
import { IReviewsEntity } from '../../../../entities/IReviewsEntity';
import { IReviewsIndicatorsEntity } from '../../../../entities/IReviewsIndicatorsEntity';
import { IReviewsReportsEntity } from '../../../../entities/IReviewsReportEntity';
import {
  IReviewsIndicatorsSliceEntity,
  IReviewsReportSliceEntity,
} from '../types/types';

/**
 * Type du Redux state global
 * Dans une vraie app, ce serait importé depuis le store
 * Ici on le définit pour l'exemple
 */
interface RootState {
  reviews: {
    ids: number[];
    entities: Record<number, IReviewsEntity | undefined>;
  };
  reviewsIndicators: {
    ids: number[];
    entities: Record<number, IReviewsIndicatorsSliceEntity | undefined>;
  };
  reviewsReport: {
    ids: number[];
    entities: Record<number, IReviewsReportSliceEntity | undefined>;
  };
}

/**
 * ============================================================================
 * SELECTORS DE BASE (Input Selectors)
 * ============================================================================
 * Ces selectors extraient simplement les parties du state.
 * Ils sont utilisés comme inputs pour les selectors composés.
 */

/** Sélectionne le dictionnaire des reviews (Record<id, review>) */
const selectReviewsEntities = (state: RootState) => state.reviews.entities;

/** Sélectionne le dictionnaire des indicators */
const selectReviewsIndicatorsEntities = (state: RootState) =>
  state.reviewsIndicators.entities;

/** Sélectionne le dictionnaire des reports */
const selectReviewsReportEntities = (state: RootState) =>
  state.reviewsReport.entities;

/**
 * ============================================================================
 * SELECTOR 1 : Dénormaliser les Reviews
 * ============================================================================
 *
 * Convertit le dictionnaire { id -> review } en array [review1, review2, ...]
 * Utile pour afficher une liste de toutes les reviews.
 *
 * MEMOIZATION :
 * Ce selector ne recalcule que si state.reviews.entities change.
 * Si on modifie state.indicators, ce selector retourne le cache.
 */
export const selectDenormalizedReviews = createSelector(
  [selectReviewsEntities],
  (reviewsEntities): IReviewsEntity[] => {
    // Object.values() extrait toutes les reviews du dictionnaire
    // filter() enlève les undefined (au cas où)
    return Object.values(reviewsEntities).filter(
      (review): review is IReviewsEntity => review !== undefined,
    );
  },
);

/**
 * ============================================================================
 * SELECTOR 2 : Dénormaliser les Indicators
 * ============================================================================
 *
 * Transforme les indicators normalisés (avec reviewIds) en indicators dénormalisés (avec reviewsList).
 * C'est ici que la "jointure" SQL se produit !
 *
 * ALGORITHME :
 * 1. Pour chaque indicator
 * 2. Pour chaque reviewId dans indicator.reviewIds
 * 3. Trouver la review correspondante dans denormalizedReviews
 * 4. Remplacer reviewIds par reviewsList (objets complets)
 *
 * DÉPENDANCES :
 * - selectReviewsIndicatorsEntities : Les indicators normalisés
 * - selectDenormalizedReviews : Les reviews dénormalisées (pour la jointure)
 *
 * MEMOIZATION :
 * Ne recalcule que si indicators OU reviews changent.
 * Si on modifie state.report, ce selector retourne le cache.
 */
export const selectDenormalizedReviewsIndicators = createSelector(
  [selectReviewsIndicatorsEntities, selectDenormalizedReviews],
  (
    reviewsIndicatorsEntities,
    denormalizedReviews,
  ): IReviewsIndicatorsEntity[] => {
    return (
      Object.values(reviewsIndicatorsEntities)
        // Enlever les undefined
        .filter(
          (indicator): indicator is IReviewsIndicatorsSliceEntity =>
            indicator !== undefined,
        )
        // Pour chaque indicator, remplacer les reviewIds par les reviews complètes
        .map((indicator) => ({
          type: indicator.type,
          monthGrowthPercentage: indicator.monthGrowthPercentage,
          // 🔑 JOINTURE : reviewIds -> reviewsList
          // C'est l'équivalent d'un SQL JOIN ON reviews.id = indicator.reviewIds
          reviewsList: indicator.reviewIds
            .map((id) => denormalizedReviews.find((review) => review.id === id))
            .filter(Boolean) as IReviewsEntity[], // Enlever les undefined
        }))
    );
  },
);

/**
 * ============================================================================
 * SELECTOR 3 : Dénormaliser les Reports
 * ============================================================================
 *
 * Reconstruit le report complet avec reviews ET indicators dénormalisés.
 * C'est le selector le plus complexe car il combine les 3 entités.
 *
 * STRUCTURE DE SORTIE :
 * ```typescript
 * {
 *   reviewsList: [{ id: 1, message: '...', ... }, ...],
 *   reviewsIndicatorList: [
 *     {
 *       type: 'EXCELLENT',
 *       reviewsList: [{ id: 1, ... }],
 *       monthGrowthPercentage: 15
 *     },
 *     ...
 *   ]
 * }
 * ```
 *
 * C'est exactement la structure que l'API renvoie !
 * Les composants peuvent utiliser ce selector pour afficher le dashboard complet.
 *
 * DÉPENDANCES :
 * - selectReviewsReportEntities : Le report normalisé
 * - selectDenormalizedReviews : Les reviews dénormalisées
 * - selectDenormalizedReviewsIndicators : Les indicators dénormalisés
 *
 * MEMOIZATION :
 * Ne recalcule que si report, indicators OU reviews changent.
 * Très important car ce selector est coûteux (plusieurs jointures).
 */
export const selectDenormalizedReviewsReports = createSelector(
  [
    selectReviewsReportEntities,
    selectDenormalizedReviews,
    selectDenormalizedReviewsIndicators,
  ],
  (
    reviewsReportsEntities,
    denormalizedReviews,
    denormalizedIndicators,
  ): IReviewsReportsEntity[] => {
    return Object.values(reviewsReportsEntities)
      .filter(
        (report): report is IReviewsReportSliceEntity => report !== undefined,
      )
      .map((report) => ({
        // 🔑 JOINTURE 1 : reportReport.reviewIds -> reviews complètes
        reviewsList: report.reviewIds
          .map((id) => denormalizedReviews.find((review) => review.id === id))
          .filter(Boolean) as IReviewsEntity[],

        // 🔑 JOINTURE 2 : report.reviewsIndicatorIds -> indicators complets
        // Note : Les IDs des indicators sont des index, pas des vrais IDs
        reviewsIndicatorList: report.reviewsIndicatorIds
          .map((id) => denormalizedIndicators.find((_, index) => index === id))
          .filter(Boolean) as IReviewsIndicatorsEntity[],
      }));
  },
);

/**
 * ============================================================================
 * SELECTOR 4 : Tout en Un (Convenience Selector)
 * ============================================================================
 *
 * Retourne les 3 entités dénormalisées en un seul objet.
 * Utile quand un composant a besoin de tout.
 *
 * MEMOIZATION :
 * Ce selector est gratuit en termes de performance car il compose
 * des selectors déjà memoized. Pas de recalcul inutile.
 */
export const selectDenormalizedReviewsData = createSelector(
  [
    selectDenormalizedReviews,
    selectDenormalizedReviewsIndicators,
    selectDenormalizedReviewsReports,
  ],
  (reviews, reviewsIndicators, reviewsReports) => ({
    reviews, // Liste simple de toutes les reviews
    reviewsIndicators, // Indicators avec reviews complètes
    reviewsReports, // Report complet
  }),
);

/**
 * ============================================================================
 * ÉVOLUTIONS FUTURES (Exemples)
 * ============================================================================
 *
 * Exemples de selectors additionnels qu'on pourrait ajouter facilement :
 *
 * // Filtrer les reviews par note
 * export const selectReviewsByRating = createSelector(
 *   [selectDenormalizedReviews, (_, rating) => rating],
 *   (reviews, rating) => reviews.filter(r => r.rating === rating)
 * );
 *
 * // Compter le nombre de reviews par type
 * export const selectReviewsCountByType = createSelector(
 *   [selectDenormalizedReviewsIndicators],
 *   (indicators) => indicators.reduce((acc, ind) => ({
 *     ...acc,
 *     [ind.type]: ind.reviewsList.length
 *   }), {})
 * );
 *
 * // Calculer la moyenne des notes
 * export const selectAverageRating = createSelector(
 *   [selectDenormalizedReviews],
 *   (reviews) => {
 *     if (reviews.length === 0) return 0;
 *     const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
 *     return sum / reviews.length;
 *   }
 * );
 */
