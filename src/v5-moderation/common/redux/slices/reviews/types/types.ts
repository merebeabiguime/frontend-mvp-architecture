/**
 * COUCHE REDUX - Types pour Slices Normalisés
 * =============================================
 *
 * Ces types définissent la structure des entités TELLES QU'ELLES SONT STOCKÉES DANS REDUX.
 * Ils diffèrent des entités "métier" car ils utilisent des IDs au lieu d'objets imbriqués.
 *
 * NORMALISATION : POURQUOI ?
 * ==========================
 *
 * **Problème avec structure dénormalisée (imbriquée) :**
 * ```typescript
 * {
 *   report: {
 *     reviewsList: [{ id: 1, message: '...' }, { id: 2, message: '...' }],
 *     indicatorList: [
 *       {
 *         type: 'EXCELLENT',
 *         reviewsList: [{ id: 1, message: '...' }]  // ❌ DUPLICATION !
 *       }
 *     ]
 *   }
 * }
 * ```
 * Problèmes :
 * - La review avec id:1 existe en 2 endroits
 * - Si on modifie cette review, il faut la mettre à jour partout
 * - Bugs de synchronisation garantis en MVP qui itère vite
 * - Performance : Plus de données = plus de mémoire
 *
 * **Solution avec structure normalisée :**
 * ```typescript
 * {
 *   reviews: {
 *     entities: {
 *       1: { id: 1, message: '...' },  // ✅ Une seule source de vérité
 *       2: { id: 2, message: '...' }
 *     }
 *   },
 *   indicators: {
 *     entities: {
 *       0: { id: 0, type: 'EXCELLENT', reviewIds: [1] }  // ✅ Référence par ID
 *     }
 *   }
 * }
 * ```
 * Avantages :
 * - Chaque entité existe une seule fois
 * - Modification d'une review = 1 seul endroit à mettre à jour
 * - Pas de risque de désynchronisation
 * - Performance optimale
 * - Évolutivité garantie (10 ou 10000 reviews, même complexité)
 *
 * ANALOGIE BASE DE DONNÉES :
 * C'est exactement comme une BDD relationnelle avec foreign keys !
 * - Table "reviews" avec primary key "id"
 * - Table "indicators" avec foreign key "reviewIds[]"
 */

import { ReviewsTypesEnum } from '../../../../enums/ReviewsTypesEnum';

/**
 * Entité Report telle que stockée dans Redux
 * Contient uniquement des IDs référençant les reviews et indicateurs
 */
export interface IReviewsReportSliceEntity {
  /** ID du rapport (généralement 0 car il n'y a qu'un seul rapport par restaurant) */
  id: number;

  /** IDs des reviews appartenant à ce rapport */
  reviewIds: number[];

  /** IDs des indicateurs (index-based car calculés côté client) */
  reviewsIndicatorIds: number[];
}

/**
 * Entité Indicator telle que stockée dans Redux
 * Référence les reviews par ID au lieu de les dupliquer
 */
export interface IReviewsIndicatorsSliceEntity {
  /** ID de l'indicateur (index dans la liste, car c'est une donnée agrégée) */
  id: number;

  /** IDs des reviews de cette catégorie (au lieu de l'objet complet) */
  reviewIds: number[];

  /** Type de catégorie (MAUVAIS, NORMAL, BON, EXCELLENT) */
  type: ReviewsTypesEnum;

  /** Croissance mensuelle en pourcentage */
  monthGrowthPercentage: number;
}
