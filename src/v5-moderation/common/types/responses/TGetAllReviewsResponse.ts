/**
 * COUCHE TYPES - Response DTOs (Rapport Complet)
 * ===============================================
 *
 * Réponse de l'endpoint GET /api/reviews/find-all
 * Retourne TOUTES les données reviews : reviews individuelles + indicateurs agrégés
 *
 * STRUCTURE DÉNORMALISÉE DE L'API :
 * L'API renvoie une structure imbriquée (report contient des listes qui contiennent des objets).
 * Cette structure sera normalisée par le transformer avant d'être stockée dans Redux.
 *
 * POURQUOI NORMALISER ?
 * - Performance : Évite la duplication de données
 * - Cohérence : Une review modifiée se met à jour partout automatiquement
 * - Scalabilité : Gérer 1000+ reviews reste performant
 */

import { IReviewsReportsEntity } from '../../entities/IReviewsReportEntity';

/**
 * Réponse contenant le rapport complet des reviews
 */
export interface TGetAllReviewsResponse {
  report: IReviewsReportsEntity;
}
