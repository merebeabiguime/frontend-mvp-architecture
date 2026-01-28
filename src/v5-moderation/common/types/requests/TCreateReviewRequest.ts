/**
 * COUCHE TYPES - Request DTOs (Data Transfer Objects)
 * ====================================================
 *
 * Ces types définissent la structure des données ENVOYÉES à l'API.
 * Ils sont différents des entités car ils représentent les données "en transit".
 *
 * POURQUOI SÉPARER REQUÊTE ET ENTITÉ ?
 * - API Request : Données incomplètes (pas d'ID, pas de date - générés côté backend)
 * - Entité : Données complètes reçues du backend
 * - Clarté : On sait exactement quoi envoyer vs ce qu'on reçoit
 *
 * AVANTAGE MVP :
 * - Si l'API change (nouveau champ requis), on modifie UNIQUEMENT ce fichier
 * - Les composants et Redux ne sont pas impactés
 */

/**
 * Structure d'une nouvelle review à créer
 * (avant qu'elle ne soit enregistrée en base de données)
 */
export interface TNewReview {
  /** Note donnée par le client (1-5 étoiles) */
  rating: number;

  /** Commentaire textuel de l'avis */
  message: string;

  /** Numéro de table du client */
  tableNumber: number;
}

/**
 * Payload de la requête POST /api/reviews/create
 */
export interface TCreateReviewRequest {
  review: TNewReview;
}
