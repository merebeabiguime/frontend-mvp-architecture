/**
 * COUCHE ENTITÉ - Rapport Global
 * ===============================
 *
 * Cette entité représente le rapport complet des reviews d'un restaurant.
 * Elle agrège toutes les reviews et tous les indicateurs en un seul objet.
 *
 * UTILITÉ :
 * - C'est ce que l'API renvoie quand on demande "toutes les données reviews"
 * - Permet d'afficher un dashboard complet avec stats globales + détails par catégorie
 * - Structure dénormalisée (imbriquée) côté API, normalisée côté Redux (voir transformers)
 */

import { IReviewsEntity } from './IReviewsEntity';
import { IReviewsIndicatorsEntity } from './IReviewsIndicatorsEntity';

export interface IReviewsReportsEntity {
  /** Liste complète de toutes les reviews du restaurant */
  reviewsList: IReviewsEntity[];

  /** Liste des indicateurs par catégorie (4 catégories : MAUVAIS, NORMAL, BON, EXCELLENT) */
  reviewsIndicatorList: IReviewsIndicatorsEntity[];
}
