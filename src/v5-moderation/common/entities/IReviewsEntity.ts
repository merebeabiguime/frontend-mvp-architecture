/**
 * COUCHE ENTITÉ - Domain Model
 * =============================
 *
 * Cette entité représente le modèle de données "métier" d'une review.
 * Elle correspond exactement à ce que le backend renvoie et ce que l'application manipule.
 *
 * PRINCIPES :
 * - Une seule source de vérité pour la structure des données
 * - Indépendante de Redux, des API, et de la présentation
 * - Facilite la maintenance : changer la structure ici la change partout
 *
 * AVANTAGES :
 * - Type safety : TypeScript nous prévient si on oublie un champ
 * - Documentation : On sait exactement quelles propriétés une review possède
 * - Réutilisabilité : Utilisée par Redux, les services, les composants
 */

export interface IReviewsEntity {
  /** Identifiant unique de la review */
  id: number;

  /** Contenu textuel de l'avis laissé par le client */
  message: string;

  /** Date de création au format ISO (ex: "2024-01-15T10:30:00Z") */
  date: string;

  /** ID de l'utilisateur (serveur/restaurant) qui reçoit l'avis */
  toUserId: number;

  /** Note donnée par le client (généralement de 1 à 5) */
  rating: number;

  /** Numéro de table du client dans le restaurant */
  tableNumber: number;
}
