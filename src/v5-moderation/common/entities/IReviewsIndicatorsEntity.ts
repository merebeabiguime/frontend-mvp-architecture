/**
 * COUCHE ENTITÉ - Indicateurs Agrégés
 * ====================================
 *
 * Cette entité représente un groupe de reviews classées par type (MAUVAIS, NORMAL, BON, EXCELLENT).
 * Elle inclut également des métriques de croissance pour le dashboard.
 *
 * POURQUOI UNE ENTITÉ SÉPARÉE ?
 * - Séparation des concerns : Reviews individuelles VS statistiques agrégées
 * - Optimisation : On peut charger les stats sans charger toutes les reviews
 * - Évolutivité : Facile d'ajouter d'autres métriques (moyenne, médiane, etc.)
 */

import { IReviewsEntity } from './IReviewsEntity';
import { ReviewsTypesEnum } from '../enums/ReviewsTypesEnum';

export interface IReviewsIndicatorsEntity {
  /** Liste des reviews appartenant à cette catégorie */
  reviewsList: IReviewsEntity[];

  /** Type de catégorie (MAUVAIS, NORMAL, BON, EXCELLENT) */
  type: ReviewsTypesEnum;

  /**
   * Pourcentage de croissance par rapport au mois précédent
   * Exemple : +15 = 15% d'augmentation, -10 = 10% de diminution
   */
  monthGrowthPercentage: number;
}
