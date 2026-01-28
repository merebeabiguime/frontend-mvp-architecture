/**
 * COUCHE REDUX - Slice "Reviews"
 * ===============================
 *
 * Ce slice gère le state des reviews individuelles.
 * Il utilise Redux Toolkit's Entity Adapter pour un code minimal et performant.
 *
 * ENTITY ADAPTER : QU'EST-CE QUE C'EST ?
 * =======================================
 *
 * Entity Adapter est un outil de Redux Toolkit qui génère automatiquement :
 * - La structure normalisée { ids: [], entities: {} }
 * - Les reducers CRUD (addOne, addMany, updateOne, removeOne, etc.)
 * - Les selectors optimisés (selectById, selectAll, etc.)
 *
 * AVANTAGES :
 * - ✅ Moins de code boilerplate (pas besoin d'écrire les reducers manuellement)
 * - ✅ Performance optimisée (lookup en O(1) par ID)
 * - ✅ Immuabilité garantie (grâce à Immer sous le capot)
 * - ✅ Type safety complet avec TypeScript
 *
 * STRUCTURE GÉNÉRÉE :
 * ```typescript
 * {
 *   reviews: {
 *     ids: [1, 2, 3],  // Liste ordonnée des IDs
 *     entities: {      // Map ID -> Entité pour accès rapide
 *       1: { id: 1, message: '...', rating: 5, ... },
 *       2: { id: 2, message: '...', rating: 4, ... },
 *       3: { id: 3, message: '...', rating: 5, ... }
 *     }
 *   }
 * }
 * ```
 *
 * UTILISATION DANS UN MVP EN ITÉRATION :
 * Si on veut ajouter une feature "archiver une review" :
 * 1. On ajoute `archived: boolean` dans IReviewsEntity
 * 2. On utilise `updateReview` pour changer le flag
 * 3. Aucun autre code à modifier - tout fonctionne !
 */

import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { IReviewsEntity } from '../../../entities/IReviewsEntity';

/**
 * Création de l'Entity Adapter pour les reviews
 * selectId spécifie quelle propriété utiliser comme clé unique (ici : id)
 */
const reviewsAdapter = createEntityAdapter<IReviewsEntity>({
  selectId: (review) => review.id,
  // On pourrait ajouter un tri par défaut :
  // sortComparer: (a, b) => b.date.localeCompare(a.date), // Plus récentes en premier
});

/**
 * Création du Slice Redux
 * Redux Toolkit utilise Immer pour permettre des "mutations" directes du state
 */
const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: reviewsAdapter.getInitialState(),
  reducers: {
    /**
     * Ajoute une seule review au state
     * Utilisé après la création d'une review via l'API
     */
    addReview: reviewsAdapter.addOne,

    /**
     * Ajoute plusieurs reviews au state
     * Utilisé lors du chargement initial de toutes les reviews
     */
    addReviews: reviewsAdapter.addMany,

    /**
     * Met à jour une review existante
     * Prend un objet { id: number, changes: Partial<IReviewsEntity> }
     * @example dispatch(updateReview({ id: 1, changes: { message: 'Updated message' } }))
     */
    updateReview: reviewsAdapter.updateOne,

    /**
     * Supprime une review par son ID
     * @example dispatch(removeReview(123))
     */
    removeReview: reviewsAdapter.removeOne,

    /**
     * Supprime TOUTES les reviews (utile pour logout ou changement de restaurant)
     */
    clearReviews: reviewsAdapter.removeAll,
  },
  /**
   * extraReducers permet de réagir à des actions d'AUTRES slices
   * Exemple : Si on supprime un restaurant, on pourrait supprimer ses reviews automatiquement
   * (non implémenté ici pour garder la simplicité MVP)
   */
});

// Export du reducer pour l'inclure dans le store
export const reviewsReducer = reviewsSlice.reducer;

// Export des actions pour les utiliser dans les repositories et composants
export const reviewsActions = reviewsSlice.actions;

// Export des selectors de l'adapter (pour usage avancé si besoin)
export const reviewsSelectors = reviewsAdapter.getSelectors();
