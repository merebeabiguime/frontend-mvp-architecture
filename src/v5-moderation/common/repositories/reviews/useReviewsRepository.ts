/**
 * COUCHE REPOSITORY - Orchestration Métier
 * =========================================
 *
 * Le Repository est le CHEF D'ORCHESTRE de toute l'architecture reviews.
 * C'est la couche qui CONNECTE toutes les autres couches ensemble.
 *
 * FLUX COMPLET D'UNE REQUÊTE (GET ALL REVIEWS) :
 * ===============================================
 *
 * 1. Composant appelle : `const { RgetAllReviews } = useReviewsRepository()`
 * 2. Repository appelle : `const response = await SGetAllReviews()` (Service)
 * 3. Service fait : `HTTP GET /api/reviews/find-all` (API)
 * 4. API répond : `{ report: { reviewsList: [...], reviewsIndicatorList: [...] } }` (Dénormalisé)
 * 5. Repository transforme : `const { report, reviews, indicators } = normalizeReviewsReportEntity(response.report)` (Transformer)
 * 6. Repository dispatch (Redux) :
 *    - `dispatch(reviewsActions.addReviews(reviews))`
 *    - `dispatch(reviewsIndicatorsActions.addReviewsIndicators(indicators))`
 *    - `dispatch(reviewsReportActions.addReviewReport(report))`
 * 7. Redux met à jour le state (normalisé)
 * 8. Selectors dénormalisent automatiquement
 * 9. Composants re-render avec les nouvelles données
 *
 * POURQUOI UN REPOSITORY ?
 * ========================
 *
 * Sans Repository (anti-pattern) :
 * ```typescript
 * // ❌ Dans un composant React
 * const fetchReviews = async () => {
 *   const response = await SGetAllReviews();
 *   const { report, reviews, indicators } = normalizeReviewsReportEntity(response.report);
 *   dispatch(reviewsActions.addReviews(reviews));
 *   dispatch(reviewsIndicatorsActions.addReviewsIndicators(indicators));
 *   dispatch(reviewsReportActions.addReviewReport(report));
 * };
 * ```
 * Problèmes :
 * - Logique métier dans les composants (violation SoC)
 * - Code dupliqué si plusieurs composants font la même chose
 * - Difficile à tester (faut mocker React)
 * - Difficile à maintenir (changements éparpillés)
 *
 * Avec Repository (pattern correct) :
 * ```typescript
 * // ✅ Dans un composant React
 * const { RgetAllReviews } = useReviewsRepository();
 * await RgetAllReviews();  // Simple et propre !
 * ```
 * Avantages :
 * - Logique métier centralisée en UN SEUL ENDROIT
 * - Composants simples (juste appeler une fonction)
 * - Facile à tester (pas de dépendance React)
 * - Facile à maintenir (modification = 1 fichier)
 * - Réutilisable partout
 *
 * RESPONSABILITÉS DU REPOSITORY :
 * ===============================
 *
 * 1. **Orchestration** :
 *    - Appeler les services (couche API)
 *    - Transformer les données (normalization)
 *    - Dispatcher dans Redux (state management)
 *
 * 2. **Logique métier** :
 *    - Validation des données
 *    - Gestion d'erreurs métier
 *    - Side effects (notifications, logs, analytics)
 *
 * 3. **Coordination** :
 *    - Mettre à jour plusieurs slices en une seule opération atomique
 *    - Gérer les dépendances entre entités
 *
 * CE QUE LE REPOSITORY NE FAIT PAS :
 * ==================================
 *
 * ❌ Gestion d'UI (pas de JSX, pas de hooks UI)
 * ❌ Appels HTTP directs (c'est le rôle des Services)
 * ❌ Transformation de structure (c'est le rôle des Transformers)
 * ❌ Logique de présentation (c'est le rôle des Composants)
 *
 * PATTERN UTILISÉ : Custom Hook
 * =============================
 *
 * On utilise un custom hook pour :
 * - Accéder à Redux dispatch (via useAppDispatch)
 * - Bénéficier des optimisations React (pas de re-création inutile)
 * - Rester idiomatique React
 *
 * ÉVOLUTIVITÉ MVP :
 * =================
 *
 * Si le produit évolue :
 * - Ajouter une feature "modération" ? → Ajouter RmoderateReview(id, status)
 * - Ajouter un cache ? → Ajouter une logique de cache ici
 * - Ajouter des analytics ? → Logger les events ici
 * - Changer l'API ? → Modifier uniquement le Service
 * - Changer Redux ? → Modifier uniquement les dispatch ici
 *
 * Les composants ne sont PAS IMPACTÉS par ces changements !
 */

import { useDispatch } from 'react-redux';
import { reviewsActions } from '../../redux/slices/reviews/reviewsSlice';
import { reviewsIndicatorsActions } from '../../redux/slices/reviews/reviewsIndicatorsSlice';
import { reviewsReportActions } from '../../redux/slices/reviews/reviewsReportSlice';
import { normalizeReviewsReportEntity } from '../../redux/slices/reviews/transformers/reviewsReportTransformers';
import {
  SCreateReview,
  SGetAllReviews,
} from '../../services/reviews/reviewsService';
import { TCreateReviewRequest } from '../../types/requests/TCreateReviewRequest';
import { TCreateReviewResponse } from '../../types/responses/TCreateReviewResponse';
import { TGetAllReviewsResponse } from '../../types/responses/TGetAllReviewsResponse';

/**
 * Custom Hook : Repository pour les Reviews
 *
 * @returns Objet contenant les méthodes du repository
 *
 * @example
 * ```typescript
 * // Dans un composant
 * const ReviewsPage = () => {
 *   const { RgetAllReviews, RcreateReview } = useReviewsRepository();
 *
 *   useEffect(() => {
 *     RgetAllReviews(); // Charge les reviews au montage du composant
 *   }, []);
 *
 *   const handleSubmit = async (data) => {
 *     await RcreateReview({ review: data });
 *   };
 *
 *   return <div>...</div>;
 * };
 * ```
 */
const useReviewsRepository = () => {
  /**
   * Hook Redux pour dispatcher des actions
   * Dans une vraie app, on utiliserait useAppDispatch() typé
   */
  const dispatch = useDispatch();

  /**
   * ========================================================================
   * MÉTHODE 1 : Créer une Review
   * ========================================================================
   *
   * Crée une nouvelle review et l'ajoute au state Redux.
   *
   * FLUX :
   * 1. Appeler l'API pour créer la review (Service)
   * 2. L'API retourne la review créée avec ID et date générés
   * 3. Dispatcher la review dans Redux (pas besoin de normalisation ici car c'est une seule review)
   * 4. Retourner la réponse au composant
   *
   * @param request - Données de la nouvelle review (rating, message, tableNumber)
   * @returns Promise avec la review créée
   *
   * GESTION D'ERREURS :
   * En production, on pourrait :
   * - Catch les erreurs et afficher un toast utilisateur
   * - Logger vers Sentry
   * - Dispatch une action d'erreur dans Redux
   * - Rollback optimistic updates si applicable
   *
   * ÉVOLUTION MVP :
   * Si on veut ajouter une validation côté client :
   * ```typescript
   * if (request.review.rating < 1 || request.review.rating > 5) {
   *   throw new Error('Rating must be between 1 and 5');
   * }
   * ```
   */
  const RcreateReview = async (
    request: TCreateReviewRequest,
  ): Promise<TCreateReviewResponse> => {
    // ÉTAPE 1 : Appeler le service (API call)
    const response = await SCreateReview(request);

    // ÉTAPE 2 : Dispatcher dans Redux (si la review a été créée)
    if (response.review) {
      dispatch(reviewsActions.addReview(response.review));

      // 💡 ÉVOLUTION FUTURE : On pourrait aussi mettre à jour les indicators ici
      // Par exemple, si la review est "EXCELLENT", incrémenter le compteur EXCELLENT
      // Mais pour un MVP, on recharge tout avec RgetAllReviews() après création
    }

    // ÉTAPE 3 : Retourner la réponse (le composant peut afficher un message de succès)
    return response;
  };

  /**
   * ========================================================================
   * MÉTHODE 2 : Récupérer Toutes les Reviews
   * ========================================================================
   *
   * Charge toutes les reviews avec leurs indicateurs agrégés.
   * C'est la méthode la plus complexe car elle implique la normalisation.
   *
   * FLUX :
   * 1. Appeler l'API pour récupérer le rapport complet (Service)
   * 2. L'API retourne une structure DÉNORMALISÉE (imbriquée)
   * 3. Normaliser cette structure (Transformer)
   * 4. Dispatcher les 3 entités normalisées dans leurs slices respectifs (Redux)
   * 5. Retourner la réponse au composant
   *
   * @returns Promise avec le rapport complet
   *
   * NORMALISATION :
   * Cette méthode illustre parfaitement POURQUOI on a besoin d'un Repository.
   * Sans lui, chaque composant devrait :
   * - Appeler SGetAllReviews()
   * - Appeler normalizeReviewsReportEntity()
   * - Dispatcher 3 actions Redux
   * → Code dupliqué et bugs garantis !
   *
   * OPTIMISATIONS POSSIBLES :
   * - Ajouter un cache : Si les données ont été chargées récemment, ne pas refaire l'appel
   * - Ajouter un loading state global : Dispatch loading actions
   * - Ajouter du batching : Grouper les dispatch en une seule transaction
   */
  const RgetAllReviews = async (): Promise<TGetAllReviewsResponse> => {
    // ÉTAPE 1 : Appeler le service (API call)
    const response = await SGetAllReviews();

    // ÉTAPE 2 : Vérifier que la réponse contient un rapport
    if (response.report) {
      // ÉTAPE 3 : Normaliser les données (Transformer)
      // Cette ligne transforme la structure imbriquée en 3 entités plates
      const { report, reviews, indicators } = normalizeReviewsReportEntity(
        response.report,
      );

      // ÉTAPE 4 : Dispatcher les 3 entités dans leurs slices respectifs
      // Ces 3 dispatches sont ATOMIQUES (synchrones)
      // Redux garantit qu'elles s'exécutent dans l'ordre
      dispatch(reviewsActions.addReviews(reviews)); // Ajoute toutes les reviews
      dispatch(reviewsIndicatorsActions.addReviewsIndicators(indicators)); // Ajoute les indicators
      dispatch(reviewsReportActions.addReviewReport(report)); // Ajoute le rapport

      // 🔑 POINT CLÉ : Après ces 3 dispatches, le state Redux est cohérent
      // Les selectors peuvent maintenant dénormaliser les données pour les composants
    }

    // ÉTAPE 5 : Retourner la réponse originale (au cas où le composant en a besoin)
    return response;
  };

  /**
   * ========================================================================
   * RETOUR DU HOOK
   * ========================================================================
   *
   * On retourne un objet avec toutes les méthodes du repository.
   * Convention de nommage : Préfixe "R" pour "Repository" (évite les conflits avec les Services)
   */
  return {
    RcreateReview,
    RgetAllReviews,

    /**
     * ÉVOLUTIONS FUTURES (quand le MVP itère) :
     *
     * RupdateReview: async (id: number, updates: Partial<TNewReview>) => {
     *   const response = await SUpdateReview(id, updates);
     *   if (response.review) {
     *     dispatch(reviewsActions.updateReview({ id, changes: response.review }));
     *   }
     *   return response;
     * },
     *
     * RdeleteReview: async (id: number) => {
     *   await SDeleteReview(id);
     *   dispatch(reviewsActions.removeReview(id));
     *   // Mettre à jour aussi les indicators qui référencent cette review
     * },
     *
     * RmoderateReview: async (id: number, status: 'approved' | 'rejected') => {
     *   const response = await SModerateReview(id, status);
     *   dispatch(reviewsActions.updateReview({ id, changes: { moderationStatus: status } }));
     *   return response;
     * },
     *
     * RgetReviewsByDateRange: async (startDate: string, endDate: string) => {
     *   const response = await SGetReviewsByDateRange(startDate, endDate);
     *   // Logique similaire à RgetAllReviews
     * },
     */
  };
};

export default useReviewsRepository;

/**
 * ============================================================================
 * TESTING STRATEGY (Comment tester ce Repository)
 * ============================================================================
 *
 * Le Repository est facile à tester car il a des dépendances clairement définies :
 *
 * ```typescript
 * import { renderHook } from '@testing-library/react-hooks';
 * import { Provider } from 'react-redux';
 * import useReviewsRepository from './useReviewsRepository';
 * import * as reviewsService from '../../services/reviews/reviewsService';
 *
 * jest.mock('../../services/reviews/reviewsService');
 *
 * describe('useReviewsRepository', () => {
 *   it('should fetch and normalize reviews', async () => {
 *     // Mock du service
 *     const mockResponse = { report: { ... } };
 *     jest.spyOn(reviewsService, 'SGetAllReviews').mockResolvedValue(mockResponse);
 *
 *     // Render du hook
 *     const { result } = renderHook(() => useReviewsRepository(), {
 *       wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
 *     });
 *
 *     // Appel de la méthode
 *     await result.current.RgetAllReviews();
 *
 *     // Vérifications
 *     expect(reviewsService.SGetAllReviews).toHaveBeenCalled();
 *     expect(store.getState().reviews.ids).toHaveLength(mockResponse.report.reviewsList.length);
 *   });
 * });
 * ```
 */
