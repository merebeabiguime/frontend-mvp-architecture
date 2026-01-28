/**
 * COUCHE REDUX - Slice "Reviews Indicators"
 * ==========================================
 *
 * Ce slice gère les indicateurs agrégés (statistiques par catégorie).
 * Chaque indicateur représente un groupe de reviews (MAUVAIS, NORMAL, BON, EXCELLENT).
 *
 * POURQUOI UN SLICE SÉPARÉ ?
 * ==========================
 *
 * 1. **Séparation des Concerns (SoC)** :
 *    - reviewsSlice = données brutes
 *    - reviewsIndicatorsSlice = données agrégées/calculées
 *    - Chaque slice a une responsabilité unique
 *
 * 2. **Performance** :
 *    - On peut charger les stats sans charger toutes les reviews
 *    - Utile pour un dashboard avec des KPIs
 *
 * 3. **Évolutivité** :
 *    - Facile d'ajouter d'autres agrégations (par mois, par serveur, etc.)
 *    - On pourrait avoir : reviewsByMonthSlice, reviewsByServerSlice, etc.
 *
 * RELATION AVEC reviewsSlice :
 * - Les indicateurs stockent des `reviewIds[]` (foreign keys)
 * - Les selectors vont "joindre" ces IDs avec les reviews réelles
 * - C'est exactement comme une jointure SQL !
 */

import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { IReviewsIndicatorsSliceEntity } from './types/types';

/**
 * Entity Adapter pour les indicateurs
 */
const reviewsIndicatorsAdapter = createEntityAdapter<IReviewsIndicatorsSliceEntity>({
  selectId: (indicator) => indicator.id,
});

/**
 * Slice Redux pour les indicateurs agrégés
 */
const reviewsIndicatorsSlice = createSlice({
  name: 'reviewsIndicators',
  initialState: reviewsIndicatorsAdapter.getInitialState(),
  reducers: {
    /** Ajoute un indicateur (une catégorie) */
    addReviewsIndicator: reviewsIndicatorsAdapter.addOne,

    /** Ajoute plusieurs indicateurs (généralement les 4 catégories) */
    addReviewsIndicators: reviewsIndicatorsAdapter.addMany,

    /**
     * Met à jour un indicateur existant
     * Utile pour mettre à jour le pourcentage de croissance mensuelle
     */
    updateReviewsIndicator: reviewsIndicatorsAdapter.updateOne,

    /** Supprime un indicateur */
    removeReviewsIndicator: reviewsIndicatorsAdapter.removeOne,

    /** Nettoie tous les indicateurs */
    clearIndicators: reviewsIndicatorsAdapter.removeAll,
  },
});

export const reviewsIndicatorsReducer = reviewsIndicatorsSlice.reducer;
export const reviewsIndicatorsActions = reviewsIndicatorsSlice.actions;
export const reviewsIndicatorsSelectors = reviewsIndicatorsAdapter.getSelectors();
