/**
 * COUCHE ENUM - Constantes Métier
 * ================================
 *
 * Définit les différentes catégories de reviews basées sur la note.
 * Ces catégories permettent d'organiser et d'afficher les reviews par niveau de satisfaction.
 *
 * AVANTAGES :
 * - Évite les "magic strings" dans le code
 * - Autocomplete dans l'IDE
 * - Refactoring facile (renommer une catégorie se fait en un clic)
 * - Type safety : Impossible d'utiliser une valeur invalide
 */

export enum ReviewsTypesEnum {
  /** Reviews avec note de 1-2 étoiles - Clients insatisfaits */
  MAUVAIS = 'MAUVAIS',

  /** Reviews avec note de 3 étoiles - Expérience moyenne */
  NORMAL = 'NORMAL',

  /** Reviews avec note de 4 étoiles - Clients satisfaits */
  BON = 'BON',

  /** Reviews avec note de 5 étoiles - Clients très satisfaits */
  EXCELLENT = 'EXCELLENT',
}
