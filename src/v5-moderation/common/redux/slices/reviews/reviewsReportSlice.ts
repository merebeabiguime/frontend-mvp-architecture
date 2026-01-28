/**
 * COUCHE REDUX - Slice "Reviews Report"
 * ======================================
 *
 * Ce slice gère le rapport global qui regroupe reviews + indicateurs.
 * C'est la couche "meta" qui orchestre les deux autres slices.
 *
 * POURQUOI CE SLICE ?
 * ===================
 *
 * Il pourrait sembler redondant puisqu'il ne fait que référencer les autres slices.
 * Mais il a une utilité importante :
 *
 * 1. **Structure API respectée** :
 *    - L'API renvoie un "report" contenant reviews + indicators
 *    - Ce slice maintient cette structure logique
 *
 * 2. **Point d'entrée unique** :
 *    - Au lieu de sélectionner reviews ET indicators séparément
 *    - On peut sélectionner le "report" qui contient tout
 *
 * 3. **Évolutivité** :
 *    - On peut ajouter des métadonnées au report (date de génération, filtres appliqués, etc.)
 *    - Utile pour le caching ou l'invalidation de données
 *
 * UTILISATION TYPIQUE :
 * ```typescript
 * // Au lieu de :
 * const reviews = useSelector(selectAllReviews);
 * const indicators = useSelector(selectAllIndicators);
 *
 * // On peut faire :
 * const report = useSelector(selectDenormalizedReport);
 * // report contient { reviewsList, reviewsIndicatorList }
 * ```
 *
 * NOTE : Pour un MVP simple, ce slice pourrait être omis.
 * Mais il facilite grandement l'évolution future du produit.
 */

import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { IReviewsReportSliceEntity } from './types/types';

/**
 * Entity Adapter pour le rapport
 * Note : En général, il n'y a qu'un seul rapport par restaurant (id: 0)
 * Mais on utilise l'adapter pour cohérence et évolutivité (multi-restaurants par exemple)
 */
const reviewsReportAdapter = createEntityAdapter<IReviewsReportSliceEntity>({
  selectId: (report) => report.id,
});

/**
 * Slice Redux pour le rapport global
 */
const reviewsReportSlice = createSlice({
  name: 'reviewsReport',
  initialState: reviewsReportAdapter.getInitialState(),
  reducers: {
    /** Ajoute un rapport */
    addReviewReport: reviewsReportAdapter.addOne,

    /** Ajoute plusieurs rapports (si multi-restaurants) */
    addReviewsReports: reviewsReportAdapter.addMany,

    /** Met à jour un rapport existant */
    updateReviewReport: reviewsReportAdapter.updateOne,

    /** Supprime un rapport */
    removeReviewReport: reviewsReportAdapter.removeOne,

    /** Nettoie tous les rapports */
    clearReports: reviewsReportAdapter.removeAll,
  },
});

export const reviewsReportReducer = reviewsReportSlice.reducer;
export const reviewsReportActions = reviewsReportSlice.actions;
export const reviewsReportSelectors = reviewsReportAdapter.getSelectors();
