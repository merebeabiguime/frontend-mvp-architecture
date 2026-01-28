/**
 * COUCHE SERVICES - Communication API
 * ====================================
 *
 * Cette couche contient UNIQUEMENT la logique de communication avec l'API.
 * Pas de Redux, pas de logique métier, pas d'UI - juste des appels HTTP.
 *
 * RESPONSABILITÉ UNIQUE (Single Responsibility Principle) :
 * - Appeler l'API
 * - Typer les requêtes et réponses
 * - Retourner les données brutes
 *
 * CE QUE CETTE COUCHE NE FAIT PAS :
 * ❌ Dispatch Redux (c'est le rôle du Repository)
 * ❌ Transformation de données (c'est le rôle des Transformers)
 * ❌ Gestion d'état (c'est le rôle de Redux)
 * ❌ Logique métier (c'est le rôle du Repository ou des Services métier)
 *
 * AVANTAGES POUR UN MVP EN ITÉRATION :
 *
 * 1. **Changements API isolés** :
 *    - L'API change d'endpoint ? On modifie UNIQUEMENT ce fichier
 *    - L'API renomme un champ ? On l'adapte ici, Redux et composants inchangés
 *
 * 2. **Testabilité** :
 *    - On peut mocker ce service pour tester les repositories
 *    - On peut tester ce service indépendamment avec des vraies requêtes HTTP
 *
 * 3. **Réutilisabilité** :
 *    - Plusieurs repositories peuvent utiliser le même service
 *    - Facile de créer des hooks personnalisés utilisant ces services
 *
 * 4. **Documentation vivante** :
 *    - Ce fichier documente exactement quels endpoints existent
 *    - Les types documentent le contrat API
 */

import { apiRequest, MethodEnum } from '../../api/apiRequest';
import { TCreateReviewRequest } from '../../types/requests/TCreateReviewRequest';
import { TCreateReviewResponse } from '../../types/responses/TCreateReviewResponse';
import { TGetAllReviewsResponse } from '../../types/responses/TGetAllReviewsResponse';

/**
 * POST /api/reviews/create
 *
 * Crée une nouvelle review pour un restaurant.
 *
 * @param request - Objet contenant les données de la nouvelle review (rating, message, tableNumber)
 * @returns Promise contenant la review créée avec son ID et sa date générés par le backend
 *
 * @example
 * ```typescript
 * const response = await SCreateReview({
 *   review: {
 *     rating: 5,
 *     message: 'Service excellent !',
 *     tableNumber: 12
 *   }
 * });
 * // response.review contient { id: 123, rating: 5, message: '...', date: '2024-01-15T...', ... }
 * ```
 *
 * ÉVOLUTION MVP :
 * Si le produit évolue et qu'on veut ajouter des photos aux reviews :
 * 1. On ajoute `images?: string[]` dans TNewReview
 * 2. On met à jour ce service pour envoyer les URLs d'images
 * 3. Redux, repositories, composants suivent automatiquement grâce au typage
 */
export async function SCreateReview(
  request: TCreateReviewRequest,
): Promise<TCreateReviewResponse> {
  const response = await apiRequest<TCreateReviewResponse>(
    '/api/reviews/create',
    MethodEnum.POST,
    request,
  );
  return response.data!;
}

/**
 * GET /api/reviews/find-all
 *
 * Récupère toutes les reviews d'un restaurant avec leurs indicateurs agrégés.
 * Retourne un rapport complet : liste des reviews + statistiques par catégorie.
 *
 * @returns Promise contenant le rapport complet (reviews + indicateurs)
 *
 * @example
 * ```typescript
 * const response = await SGetAllReviews();
 * // response.report contient :
 * // - reviewsList: Array<IReviewsEntity>
 * // - reviewsIndicatorList: Array<IReviewsIndicatorsEntity>
 * ```
 *
 * ÉVOLUTION MVP :
 * Si on veut filtrer les reviews par date ou par type :
 * 1. Ajouter des paramètres : `SGetAllReviews(filters?: { startDate?: string, type?: ReviewsTypesEnum })`
 * 2. Passer ces params dans l'apiRequest
 * 3. Le reste de l'architecture suit sans changement
 */
export async function SGetAllReviews(): Promise<TGetAllReviewsResponse> {
  const response = await apiRequest<TGetAllReviewsResponse>(
    '/api/reviews/find-all',
    MethodEnum.GET,
  );
  return response.data!;
}

/**
 * FUTURES ÉVOLUTIONS POSSIBLES (MVP Iteration) :
 *
 * export async function SUpdateReview(id: number, updates: Partial<TNewReview>) { ... }
 * export async function SDeleteReview(id: number) { ... }
 * export async function SGetReviewsByDateRange(startDate: string, endDate: string) { ... }
 * export async function SGetReviewsByType(type: ReviewsTypesEnum) { ... }
 * export async function SModerateReview(id: number, status: 'approved' | 'rejected') { ... }
 */
