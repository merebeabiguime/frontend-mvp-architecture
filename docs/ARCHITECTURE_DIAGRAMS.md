# 🏗️ Diagrammes d'Architecture

Ce document contient tous les diagrammes pour comprendre l'architecture du projet.

---

## 1. Vue d'Ensemble : Architecture en Couches

```mermaid
graph TB
    subgraph "PRÉSENTATION"
        UI[Components React]
    end

    subgraph "ORCHESTRATION"
        REPO[Repository Hooks]
    end

    subgraph "ÉTAT & LOGIQUE"
        REDUX[Redux Slices]
        SELECT[Selectors]
        TRANS[Transformers]
    end

    subgraph "COMMUNICATION"
        SERV[Services]
        API[apiRequest Utility]
    end

    subgraph "BACKEND"
        BACK[API Server]
    end

    UI -->|"useRepository()"| REPO
    UI -->|"useSelector()"| SELECT
    REPO -->|"API calls"| SERV
    REPO -->|"dispatch()"| REDUX
    REPO -->|"normalize()"| TRANS
    SELECT -->|"read state"| REDUX
    SERV -->|"HTTP"| API
    API -->|"POST/GET"| BACK

    style UI fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    style REPO fill:#ffa500,stroke:#333,stroke-width:2px,color:#000
    style REDUX fill:#764abc,stroke:#333,stroke-width:2px,color:#fff
    style SERV fill:#4caf50,stroke:#333,stroke-width:2px,color:#000
    style BACK fill:#333,stroke:#333,stroke-width:2px,color:#fff
```

---

## 2. Flux de Données : GET All Reviews

```mermaid
sequenceDiagram
    participant UI as Composant
    participant REPO as Repository
    participant SERV as Service
    participant API as API Server
    participant TRANS as Transformer
    participant REDUX as Redux Store
    participant SEL as Selector

    UI->>REPO: RgetAllReviews()
    REPO->>SERV: SGetAllReviews()
    SERV->>API: GET /api/reviews/find-all
    API-->>SERV: { report: {...} } (dénormalisé)
    SERV-->>REPO: Response
    REPO->>TRANS: normalizeReviewsReportEntity()
    TRANS-->>REPO: { report, reviews, indicators } (normalisé)
    REPO->>REDUX: dispatch(addReviews(reviews))
    REPO->>REDUX: dispatch(addIndicators(indicators))
    REPO->>REDUX: dispatch(addReport(report))
    REDUX-->>SEL: State updated
    SEL-->>UI: Dénormalized data
    UI->>UI: Re-render avec nouvelles données
```

**Points clés :**
1. Le composant ne connaît pas la structure de l'API
2. Le transformer normalise les données avant Redux
3. Le selector dénormalise pour l'UI
4. Chaque couche a une responsabilité unique

---

## 3. Structure Redux : Normalisation

```mermaid
graph LR
    subgraph "API Response (Dénormalisé)"
        API_REPORT[Report]
        API_REVIEWS[Reviews List]
        API_IND[Indicators]
        API_IND_REV[Reviews in Indicators]

        API_REPORT --> API_REVIEWS
        API_REPORT --> API_IND
        API_IND --> API_IND_REV
    end

    subgraph "Redux State (Normalisé)"
        REDUX_REPORT[Report Slice]
        REDUX_REVIEWS[Reviews Slice]
        REDUX_IND[Indicators Slice]

        REDUX_REPORT -->|"reviewIds: [1,2,3]"| REDUX_REVIEWS
        REDUX_REPORT -->|"indicatorIds: [0,1]"| REDUX_IND
        REDUX_IND -->|"reviewIds: [1]"| REDUX_REVIEWS
    end

    API_REPORT -.Transform.-> REDUX_REPORT
    API_REVIEWS -.Transform.-> REDUX_REVIEWS
    API_IND -.Transform.-> REDUX_IND

    style API_REPORT fill:#ffcccc,stroke:#333,stroke-width:2px
    style API_REVIEWS fill:#ffcccc,stroke:#333,stroke-width:2px
    style API_IND fill:#ffcccc,stroke:#333,stroke-width:2px
    style API_IND_REV fill:#ffcccc,stroke:#333,stroke-width:2px

    style REDUX_REPORT fill:#ccffcc,stroke:#333,stroke-width:2px
    style REDUX_REVIEWS fill:#ccffcc,stroke:#333,stroke-width:2px
    style REDUX_IND fill:#ccffcc,stroke:#333,stroke-width:2px
```

**Avantages de la normalisation :**
- ✅ Pas de duplication de données
- ✅ Une review modifiée se met à jour partout automatiquement
- ✅ Performance optimale (lookup en O(1))

---

## 4. Flux de Création : CREATE Review

```mermaid
sequenceDiagram
    participant USER as Utilisateur
    participant FORM as Formulaire
    participant REPO as Repository
    participant SERV as Service
    participant API as API Server
    participant REDUX as Redux Store
    participant SEL as Selector
    participant UI as Liste Reviews

    USER->>FORM: Remplit formulaire (rating, message)
    USER->>FORM: Click "Envoyer"
    FORM->>REPO: RcreateReview(data)
    REPO->>SERV: SCreateReview(data)
    SERV->>API: POST /api/reviews/create
    API-->>SERV: { review: {...} } (avec ID généré)
    SERV-->>REPO: Response
    REPO->>REDUX: dispatch(addReview(review))
    REDUX-->>SEL: State updated
    SEL-->>UI: Nouvelle review dans la liste
    UI->>UI: Re-render
    FORM->>USER: "Review créée avec succès !"
```

**Note :** Pas besoin de normalisation ici car c'est une seule entité.

---

## 5. Pattern Repository : Orchestration

```mermaid
graph TB
    subgraph "Repository Hook"
        REPO_HOOK[useReviewsRepository]

        subgraph "Methods"
            METHOD_CREATE[RcreateReview]
            METHOD_GET[RgetAllReviews]
            METHOD_UPDATE[RupdateReview]
            METHOD_DELETE[RdeleteReview]
        end

        REPO_HOOK --> METHOD_CREATE
        REPO_HOOK --> METHOD_GET
        REPO_HOOK --> METHOD_UPDATE
        REPO_HOOK --> METHOD_DELETE
    end

    subgraph "Dependencies"
        DISPATCH[useDispatch]
        SERVICE[reviewsService]
        TRANSFORM[Transformers]
        ACTIONS[Redux Actions]
    end

    METHOD_CREATE --> SERVICE
    METHOD_CREATE --> DISPATCH
    METHOD_GET --> SERVICE
    METHOD_GET --> TRANSFORM
    METHOD_GET --> DISPATCH
    METHOD_GET --> ACTIONS

    style REPO_HOOK fill:#ffa500,stroke:#333,stroke-width:3px,color:#000
    style METHOD_CREATE fill:#90caf9,stroke:#333,stroke-width:2px
    style METHOD_GET fill:#90caf9,stroke:#333,stroke-width:2px
    style METHOD_UPDATE fill:#90caf9,stroke:#333,stroke-width:2px
    style METHOD_DELETE fill:#90caf9,stroke:#333,stroke-width:2px
```

**Le Repository est le chef d'orchestre :**
- Coordonne Services + Redux
- Transforme les données
- Centralise la logique métier
- Interface stable pour les composants

---

## 6. Selector Pattern : Dénormalisation avec Memoization

```mermaid
graph TB
    subgraph "Redux State (Normalisé)"
        STATE_REVIEWS[reviews.entities<br/>{1: {id:1, ...}, 2: {id:2, ...}}]
        STATE_IND[indicators.entities<br/>{0: {reviewIds: [1]}, ...}]
        STATE_REPORT[report.entities<br/>{0: {reviewIds: [1,2], ...}}]
    end

    subgraph "Selectors (avec createSelector)"
        SEL1[selectDenormalizedReviews]
        SEL2[selectDenormalizedIndicators]
        SEL3[selectDenormalizedReport]
    end

    subgraph "Output pour Composants (Dénormalisé)"
        OUT_REVIEWS[Array de Reviews]
        OUT_IND[Indicators avec reviewsList complètes]
        OUT_REPORT[Report complet]
    end

    STATE_REVIEWS --> SEL1
    SEL1 --> OUT_REVIEWS

    STATE_IND --> SEL2
    OUT_REVIEWS --> SEL2
    SEL2 --> OUT_IND

    STATE_REPORT --> SEL3
    OUT_REVIEWS --> SEL3
    OUT_IND --> SEL3
    SEL3 --> OUT_REPORT

    style SEL1 fill:#ffeb3b,stroke:#333,stroke-width:2px
    style SEL2 fill:#ffeb3b,stroke:#333,stroke-width:2px
    style SEL3 fill:#ffeb3b,stroke:#333,stroke-width:2px
```

**Memoization avec createSelector :**
- Ne recalcule que si les inputs changent
- Cache le résultat précédent
- Évite les re-renders inutiles
- Performance optimale

---

## 7. Comparaison : Avec vs Sans Architecture

### Sans Architecture (Anti-pattern)

```mermaid
graph TB
    COMP1[Composant A]
    COMP2[Composant B]
    COMP3[Composant C]

    COMP1 -->|"fetch()"| API[API]
    COMP2 -->|"fetch()"| API
    COMP3 -->|"fetch()"| API

    COMP1 -->|"useState"| STATE1[State Local A]
    COMP2 -->|"useState"| STATE2[State Local B]
    COMP3 -->|"useState"| STATE3[State Local C]

    style COMP1 fill:#ff6b6b,stroke:#333,stroke-width:2px
    style COMP2 fill:#ff6b6b,stroke:#333,stroke-width:2px
    style COMP3 fill:#ff6b6b,stroke:#333,stroke-width:2px
```

**Problèmes :**
- ❌ Logique dupliquée dans chaque composant
- ❌ State désynchronisé entre composants
- ❌ Impossible à tester
- ❌ Appels API non optimisés

### Avec Architecture (Bon Pattern)

```mermaid
graph TB
    COMP1[Composant A]
    COMP2[Composant B]
    COMP3[Composant C]

    REPO[Repository]
    REDUX[Redux Store]
    SERV[Service]
    API[API]

    COMP1 -->|"useRepo()"| REPO
    COMP2 -->|"useRepo()"| REPO
    COMP3 -->|"useRepo()"| REPO

    COMP1 -->|"useSelector()"| REDUX
    COMP2 -->|"useSelector()"| REDUX
    COMP3 -->|"useSelector()"| REDUX

    REPO -->|"dispatch()"| REDUX
    REPO --> SERV
    SERV --> API

    style COMP1 fill:#51cf66,stroke:#333,stroke-width:2px
    style COMP2 fill:#51cf66,stroke:#333,stroke-width:2px
    style COMP3 fill:#51cf66,stroke:#333,stroke-width:2px
    style REPO fill:#ffa500,stroke:#333,stroke-width:3px
    style REDUX fill:#764abc,stroke:#333,stroke-width:3px
```

**Avantages :**
- ✅ Logique centralisée (1 seul endroit)
- ✅ State synchronisé automatiquement
- ✅ Facile à tester (mock le repo)
- ✅ Appels API optimisés (cache Redux)

---

## 8. Évolution MVP : Ajout de Feature

**Exemple : Ajouter des images aux reviews**

```mermaid
graph LR
    subgraph "Changements Nécessaires"
        ENTITY[1. IReviewsEntity<br/>+ imageUrls]
        SERVICE[2. reviewsService<br/>+ SUploadImage]
        REPO[3. useReviewsRepository<br/>+ RuploadImage]
        COMP[4. ReviewCard<br/>+ ImageDisplay]
    end

    ENTITY --> SERVICE
    SERVICE --> REPO
    REPO --> COMP

    subgraph "Pas de Changement"
        NO_REDUX[❌ Redux Slices]
        NO_SEL[❌ Selectors]
        NO_TRANS[❌ Transformers]
    end

    style ENTITY fill:#51cf66,stroke:#333,stroke-width:2px
    style SERVICE fill:#51cf66,stroke:#333,stroke-width:2px
    style REPO fill:#51cf66,stroke:#333,stroke-width:2px
    style COMP fill:#51cf66,stroke:#333,stroke-width:2px

    style NO_REDUX fill:#e9ecef,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
    style NO_SEL fill:#e9ecef,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
    style NO_TRANS fill:#e9ecef,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5
```

**Total : 4 fichiers modifiés, ~80 lignes ajoutées**

vs

**Sans architecture : 15+ fichiers, ~450 lignes modifiées**

---

## 9. Testing Strategy

```mermaid
graph TB
    subgraph "Tests Unitaires"
        TEST_SERV[Services Tests<br/>Mock apiRequest]
        TEST_TRANS[Transformers Tests<br/>Pure functions]
        TEST_SEL[Selectors Tests<br/>Mock Redux state]
        TEST_REPO[Repository Tests<br/>Mock Service + Dispatch]
    end

    subgraph "Tests d'Intégration"
        TEST_INT[Redux Integration<br/>Real store + actions]
        TEST_FLOW[Full Flow Test<br/>API → Redux → UI]
    end

    subgraph "Tests E2E"
        TEST_E2E[Cypress/Playwright<br/>User scenarios]
    end

    TEST_SERV --> TEST_INT
    TEST_TRANS --> TEST_INT
    TEST_SEL --> TEST_INT
    TEST_REPO --> TEST_INT

    TEST_INT --> TEST_FLOW
    TEST_FLOW --> TEST_E2E

    style TEST_SERV fill:#90caf9,stroke:#333,stroke-width:2px
    style TEST_TRANS fill:#90caf9,stroke:#333,stroke-width:2px
    style TEST_SEL fill:#90caf9,stroke:#333,stroke-width:2px
    style TEST_REPO fill:#90caf9,stroke:#333,stroke-width:2px
```

**Testabilité excellente :**
- Chaque couche testable indépendamment
- Mocks simples et clairs
- Tests rapides à exécuter

---

## 10. AI-Assisted Development

```mermaid
graph LR
    subgraph "Developer + AI"
        DEV[Developer]
        AI[AI Assistant<br/>Claude/Cursor]
    end

    subgraph "Architecture Patterns"
        PATTERN1[Entity Adapter Pattern]
        PATTERN2[Repository Pattern]
        PATTERN3[Selector Pattern]
        PATTERN4[Naming Conventions]
    end

    subgraph "Code Generation"
        GEN_ENTITY[Generate Entity]
        GEN_SLICE[Generate Redux Slice]
        GEN_SERV[Generate Service]
        GEN_REPO[Generate Repository]
        GEN_COMP[Generate Component]
    end

    DEV -->|"Explain pattern"| AI
    AI -->|"Understand structure"| PATTERN1
    AI -->|"Recognize naming"| PATTERN4

    DEV -->|"Prompt: Create product slice"| AI
    AI --> GEN_SLICE
    GEN_SLICE -->|"Following pattern"| PATTERN1

    DEV -->|"Prompt: Create service"| AI
    AI --> GEN_SERV
    GEN_SERV -->|"Following pattern"| PATTERN2

    style AI fill:#ff9800,stroke:#333,stroke-width:3px,color:#000
    style GEN_SLICE fill:#51cf66,stroke:#333,stroke-width:2px
    style GEN_SERV fill:#51cf66,stroke:#333,stroke-width:2px
```

**L'IA est boostée par l'architecture :**
- Patterns consistants → Génération fiable
- Naming cohérent → Compréhension rapide
- Code commenté → Context pour l'IA
- Résultat : 10x plus rapide avec l'IA

---

## Conclusion

Ces diagrammes illustrent comment chaque couche de l'architecture collabore pour :
- ✅ Séparer les responsabilités
- ✅ Maintenir la cohérence des données
- ✅ Optimiser les performances
- ✅ Faciliter les tests
- ✅ Accélérer les itérations

**L'architecture n'est pas de la complexité inutile, c'est de la simplicité organisée.**
