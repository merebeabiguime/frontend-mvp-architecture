/**
 * COUCHE TYPES - Response DTOs
 * =============================
 *
 * Ces types définissent la structure des données REÇUES de l'API.
 *
 * PATTERN RESPONSE :
 * - Encapsule l'entité retournée par le backend
 * - Permet d'ajouter facilement des métadonnées (success, message, errors, etc.)
 * - Cohérence : Toutes les réponses API suivent la même structure
 *
 * ÉVOLUTIVITÉ MVP :
 * Si on veut ajouter { success: boolean, message: string } plus tard,
 * on le fait ici sans toucher aux composants.
 */

import { IReviewsEntity } from '../../entities/IReviewsEntity';

/**
 * Réponse de l'API après création d'une review
 * Contient la review complète avec ID et date générés par le backend
 */
export interface TCreateReviewResponse {
  review: IReviewsEntity;
}
