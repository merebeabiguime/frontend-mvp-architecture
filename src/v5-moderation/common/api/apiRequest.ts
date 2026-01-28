/**
 * COUCHE API - Utilitaire HTTP Centralisé
 * ========================================
 *
 * Cette fonction est l'unique point d'entrée pour TOUTES les requêtes HTTP de l'application.
 * Tous les services l'utilisent pour communiquer avec le backend.
 *
 * AVANTAGES DE LA CENTRALISATION :
 *
 * 1. **Maintenance facilitée** :
 *    - Ajouter un header d'authentification ? Modifier 1 ligne ici, pas 50 services
 *    - Changer l'URL de base ? 1 seule modification
 *    - Ajouter un système de retry ? Impacte toutes les requêtes automatiquement
 *
 * 2. **Gestion d'erreurs cohérente** :
 *    - Toutes les erreurs 401 redirigent vers le login
 *    - Toutes les erreurs 500 affichent un message utilisateur
 *    - Log automatique de toutes les requêtes pour le debug
 *
 * 3. **Évolutivité MVP** :
 *    - Ajouter un loading global ? Dispatch Redux ici
 *    - Ajouter du monitoring (Sentry) ? Une seule intégration
 *    - Rate limiting ? Implémenté une seule fois
 *
 * PATTERN UTILISÉ :
 * - Generic <T> pour le type safety des réponses
 * - Async/await pour la lisibilité
 * - Gestion d'erreurs avec try/catch
 */

import axios, { AxiosResponse } from 'axios';

/** Base URL de l'API - À configurer via variable d'environnement en production */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Enum des méthodes HTTP supportées */
export enum MethodEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * Fonction générique pour toutes les requêtes HTTP
 *
 * @template T - Type de la réponse attendue (ex: TCreateReviewResponse)
 * @param endpoint - Chemin de l'endpoint (ex: '/api/reviews/create')
 * @param method - Méthode HTTP (GET, POST, PUT, DELETE)
 * @param data - Payload de la requête (optionnel, pour POST/PUT)
 * @returns Promise contenant la réponse typée
 *
 * @example
 * ```typescript
 * const response = await apiRequest<TCreateReviewResponse>(
 *   '/api/reviews/create',
 *   MethodEnum.POST,
 *   { review: { rating: 5, message: 'Excellent!' } }
 * );
 * ```
 */
export async function apiRequest<T>(
  endpoint: string,
  method: MethodEnum,
  data?: unknown,
): Promise<AxiosResponse<T>> {
  try {
    // Construction de l'URL complète
    const url = `${API_BASE_URL}${endpoint}`;

    // Configuration de la requête
    const config = {
      method,
      url,
      data: method !== MethodEnum.GET ? data : undefined,
      params: method === MethodEnum.GET ? data : undefined,
      headers: {
        'Content-Type': 'application/json',
        // Le token d'authentification serait ajouté ici en production
        // 'Authorization': `Bearer ${getAccessToken()}`,
      },
    };

    // Exécution de la requête
    const response = await axios(config);

    // Log en développement (à retirer en production ou remplacer par un vrai logger)
    if (import.meta.env.DEV) {
      console.log(`[API ${method}] ${endpoint}`, {
        request: data,
        response: response.data,
      });
    }

    return response;
  } catch (error) {
    // Gestion centralisée des erreurs
    console.error(`[API ERROR] ${method} ${endpoint}`, error);

    // En production, on pourrait :
    // - Logger vers Sentry
    // - Afficher un toast d'erreur global
    // - Rediriger vers /login si 401
    // - Retry automatique si erreur réseau

    throw error;
  }
}
