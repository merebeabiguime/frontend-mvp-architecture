/**
 * COMPOSANT DASHBOARD - Exemple d'Utilisation de l'Architecture
 * ==============================================================
 *
 * Ce composant démontre comment toutes les couches travaillent ensemble.
 * Il illustre la SIMPLICITÉ résultante d'une bonne architecture.
 *
 * RESPONSABILITÉ DE CE COMPOSANT :
 * - Afficher l'interface utilisateur
 * - Gérer les interactions utilisateur (clicks, forms)
 * - Déléguer la logique métier au Repository
 * - Souscrire aux données Redux via les Selectors
 *
 * CE QUE CE COMPOSANT NE FAIT PAS :
 * ❌ Appels API directs (c'est le rôle du Repository)
 * ❌ Transformation de données (c'est le rôle des Selectors/Transformers)
 * ❌ Logique métier complexe (c'est le rôle du Repository)
 *
 * SIMPLICITÉ GRÂCE À L'ARCHITECTURE :
 * ===================================
 *
 * Comparez cette approche à un composant sans architecture :
 *
 * SANS ARCHITECTURE (anti-pattern) :
 * ```typescript
 * const BadComponent = () => {
 *   const [reviews, setReviews] = useState([]);
 *   const [loading, setLoading] = useState(false);
 *
 *   useEffect(() => {
 *     setLoading(true);
 *     fetch('/api/reviews/find-all')
 *       .then(res => res.json())
 *       .then(data => {
 *         // ❌ Logique de transformation ici (devrait être ailleurs)
 *         const normalized = normalizeData(data);
 *         setReviews(normalized);
 *       })
 *       .catch(err => {
 *         // ❌ Gestion d'erreurs basique (devrait être centralisée)
 *         console.error(err);
 *       })
 *       .finally(() => setLoading(false));
 *   }, []);
 *
 *   // ❌ State local dupliqué (devrait être dans Redux)
 *   // ❌ Logique API dans le composant (devrait être dans un Service)
 *   // ❌ Difficiletté à tester (mock fetch, mock useEffect, etc.)
 *   // ❌ Impossible à réutiliser (logique couplée à l'UI)
 *
 *   return <div>...</div>;
 * };
 * ```
 *
 * AVEC ARCHITECTURE (bon pattern) :
 * ```typescript
 * const GoodComponent = () => {
 *   const { RgetAllReviews } = useReviewsRepository();  // ✅ Repository
 *   const report = useSelector(selectDenormalizedReviewsReports);  // ✅ Selector
 *
 *   useEffect(() => {
 *     RgetAllReviews();  // ✅ Simple et propre !
 *   }, []);
 *
 *   // ✅ Composant simple et lisible
 *   // ✅ Logique métier séparée (dans le Repository)
 *   // ✅ State centralisé (dans Redux)
 *   // ✅ Facile à tester (pas de side effects complexes)
 *   // ✅ Réutilisable partout
 *
 *   return <div>...</div>;
 * };
 * ```
 *
 * AVANTAGES POUR UN MVP EN ITÉRATION :
 * ====================================
 *
 * 1. **Modification de l'API** :
 *    - L'API change d'URL ? → Modifier uniquement le Service
 *    - Ce composant continue de fonctionner sans modification
 *
 * 2. **Ajout de features** :
 *    - Besoin de filtrer les reviews ? → Ajouter un nouveau Selector
 *    - Ce composant peut utiliser le nouveau Selector facilement
 *
 * 3. **Refactoring** :
 *    - Besoin de changer Redux ? → Modifier Repository et Selectors
 *    - Ce composant continue de fonctionner (interface stable)
 *
 * 4. **Tests** :
 *    - On peut mocker useReviewsRepository facilement
 *    - On peut mocker le Selector facilement
 *    - Tests simples et rapides
 *
 * 5. **Collaboration** :
 *    - Un dev peut travailler sur ce composant
 *    - Un autre dev peut travailler sur le Repository
 *    - Pas de conflits Git, pas de blocage
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useReviewsRepository from '../common/repositories/reviews/useReviewsRepository';
import {
  selectDenormalizedReviewsReports,
  selectDenormalizedReviewsIndicators,
} from '../common/redux/slices/reviews/selectors/selectors';
import { ReviewsTypesEnum } from '../common/enums/ReviewsTypesEnum';

/**
 * Composant principal du Dashboard Reviews
 *
 * Affiche :
 * - Les KPIs (nombre de reviews par catégorie avec croissance)
 * - La liste des dernières reviews
 */
const ReviewsDashboard: React.FC = () => {
  /**
   * ÉTAPE 1 : Récupérer les méthodes du Repository
   * Le hook useReviewsRepository() nous donne accès aux opérations métier
   */
  const { RgetAllReviews } = useReviewsRepository();

  /**
   * ÉTAPE 2 : Souscrire aux données Redux via les Selectors
   *
   * Ces selectors :
   * - Extraient les données du state Redux
   * - Les dénormalisent (joignent les entités)
   * - Sont memoized (pas de recalcul inutile)
   * - Provoquent un re-render uniquement si les données changent
   */
  const reports = useSelector(selectDenormalizedReviewsReports);
  const indicators = useSelector(selectDenormalizedReviewsIndicators);

  /**
   * State local pour le loading
   * Note : Dans une app plus complexe, le loading pourrait aussi être dans Redux
   */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * ÉTAPE 3 : Charger les données au montage du composant
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔑 SIMPLICITÉ : Un seul appel pour tout charger
        // Le Repository s'occupe de :
        // - Appeler l'API
        // - Normaliser les données
        // - Dispatcher dans Redux
        await RgetAllReviews();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement des reviews',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [RgetAllReviews]);

  /**
   * ÉTAPE 4 : Gérer les états de chargement et d'erreur
   */
  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Chargement des reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Erreur : {error}</p>
        <button onClick={() => RgetAllReviews()}>Réessayer</button>
      </div>
    );
  }

  /**
   * ÉTAPE 5 : Extraire les données pour l'affichage
   */
  const report = reports[0]; // Il n'y a généralement qu'un seul rapport

  if (!report) {
    return (
      <div className="dashboard-empty">
        <p>Aucune review disponible.</p>
      </div>
    );
  }

  /**
   * ÉTAPE 6 : Calculer des métriques globales (optionnel)
   */
  const totalReviews = report.reviewsList.length;
  const averageRating =
    totalReviews > 0
      ? (
          report.reviewsList.reduce((sum, r) => sum + r.rating, 0) /
          totalReviews
        ).toFixed(1)
      : '0';

  /**
   * ÉTAPE 7 : Rendu de l'interface
   *
   * Note : Dans une vraie app, on extrairait ces sous-composants :
   * - <ReviewsKPICard /> pour les indicateurs
   * - <ReviewsList /> pour la liste
   * - <ReviewCard /> pour une review individuelle
   */
  return (
    <div className="reviews-dashboard">
      {/* En-tête avec métriques globales */}
      <header className="dashboard-header">
        <h1>Dashboard Reviews</h1>
        <div className="global-metrics">
          <div className="metric">
            <span className="metric-value">{totalReviews}</span>
            <span className="metric-label">Total Reviews</span>
          </div>
          <div className="metric">
            <span className="metric-value">{averageRating} / 5</span>
            <span className="metric-label">Note Moyenne</span>
          </div>
        </div>
      </header>

      {/* KPIs par catégorie */}
      <section className="kpi-section">
        <h2>Répartition par Catégorie</h2>
        <div className="kpi-grid">
          {indicators.map((indicator, index) => {
            // Déterminer la couleur selon le type
            const colorClass = getColorClass(indicator.type);

            return (
              <div key={index} className={`kpi-card ${colorClass}`}>
                <div className="kpi-header">
                  <h3>{translateType(indicator.type)}</h3>
                  {/* Indicateur de croissance */}
                  <span
                    className={`growth ${indicator.monthGrowthPercentage >= 0 ? 'positive' : 'negative'}`}
                  >
                    {indicator.monthGrowthPercentage >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(indicator.monthGrowthPercentage)}%
                  </span>
                </div>
                <div className="kpi-value">{indicator.reviewsList.length}</div>
                <div className="kpi-label">reviews</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Liste des dernières reviews */}
      <section className="reviews-section">
        <h2>Dernières Reviews</h2>
        <div className="reviews-list">
          {report.reviewsList.slice(0, 10).map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-rating">
                  {/* Affichage des étoiles */}
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={i < review.rating ? 'star filled' : 'star'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="review-message">{review.message}</p>
              <div className="review-footer">
                <span className="review-table">Table {review.tableNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Styles inline pour l'exemple (dans une vraie app, ce serait dans un fichier CSS) */}
      <style>{`
        .reviews-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .global-metrics {
          display: flex;
          gap: 2rem;
          margin-top: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .metric-label {
          color: #666;
          font-size: 0.875rem;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          padding: 1.5rem;
          border-radius: 8px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
        }

        .kpi-card.excellent {
          border-color: #28a745;
          background: #d4edda;
        }

        .kpi-card.bon {
          border-color: #17a2b8;
          background: #d1ecf1;
        }

        .kpi-card.normal {
          border-color: #ffc107;
          background: #fff3cd;
        }

        .kpi-card.mauvais {
          border-color: #dc3545;
          background: #f8d7da;
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .growth {
          font-size: 0.875rem;
          font-weight: bold;
        }

        .growth.positive {
          color: #28a745;
        }

        .growth.negative {
          color: #dc3545;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .kpi-label {
          color: #666;
          font-size: 0.875rem;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .review-card {
          padding: 1rem;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: white;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .review-rating .star {
          color: #ccc;
          font-size: 1.25rem;
        }

        .review-rating .star.filled {
          color: #ffc107;
        }

        .review-date {
          color: #666;
          font-size: 0.875rem;
        }

        .review-message {
          color: #333;
          margin: 0.5rem 0;
        }

        .review-footer {
          color: #666;
          font-size: 0.875rem;
        }

        .dashboard-loading,
        .dashboard-error,
        .dashboard-empty {
          text-align: center;
          padding: 3rem;
        }

        .dashboard-error button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .dashboard-error button:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

/**
 * FONCTIONS UTILITAIRES
 * =====================
 * Dans une vraie app, ces fonctions seraient dans un fichier utils séparé
 */

/** Convertit le type enum en classe CSS */
function getColorClass(type: ReviewsTypesEnum): string {
  switch (type) {
    case ReviewsTypesEnum.EXCELLENT:
      return 'excellent';
    case ReviewsTypesEnum.BON:
      return 'bon';
    case ReviewsTypesEnum.NORMAL:
      return 'normal';
    case ReviewsTypesEnum.MAUVAIS:
      return 'mauvais';
    default:
      return '';
  }
}

/** Traduit le type enum en français */
function translateType(type: ReviewsTypesEnum): string {
  switch (type) {
    case ReviewsTypesEnum.EXCELLENT:
      return 'Excellent';
    case ReviewsTypesEnum.BON:
      return 'Bon';
    case ReviewsTypesEnum.NORMAL:
      return 'Normal';
    case ReviewsTypesEnum.MAUVAIS:
      return 'Mauvais';
    default:
      return type;
  }
}

export default ReviewsDashboard;

/**
 * ============================================================================
 * REMARQUES POUR L'ÉVOLUTION MVP
 * ============================================================================
 *
 * Ce composant est volontairement simple pour démontrer l'architecture.
 * Dans une vraie app en itération, on pourrait ajouter :
 *
 * 1. **Filtres** :
 *    - Filtrer par type de review
 *    - Filtrer par plage de dates
 *    - Recherche dans les messages
 *
 * 2. **Pagination** :
 *    - Charger les reviews par lots de 20
 *    - Infinite scroll ou pagination classique
 *
 * 3. **Tri** :
 *    - Trier par date (récent/ancien)
 *    - Trier par note (meilleur/pire)
 *
 * 4. **Modération** :
 *    - Boutons pour approuver/rejeter une review
 *    - Système de flags pour les reviews inappropriées
 *
 * 5. **Analytics** :
 *    - Graphiques d'évolution dans le temps
 *    - Comparaison période vs période
 *
 * **L'architecture supporte toutes ces évolutions facilement :**
 * - Ajouter des méthodes dans le Repository
 * - Ajouter des selectors pour les filtres/tri
 * - Extraire des sous-composants réutilisables
 * - Le composant principal reste simple et maintenable
 */
