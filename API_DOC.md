# FormFlow — Documentation API

**Base URL :** `http://localhost:3000/api`  
**Format :** JSON  
**Auth :** Bearer Token JWT (header `Authorization: Bearer <token>`)

---

## Sommaire

1. [Auth](#1-auth)
2. [Formulaires](#2-formulaires)
3. [Questions](#3-questions)
4. [Réponses élèves (public)](#4-réponses-élèves--routes-publiques)
5. [Réponses — vue prof](#5-réponses--vue-prof)
6. [Analytics](#6-analytics)
7. [IA — Insights](#7-ia--insights)
8. [Codes d'erreur](#8-codes-derreur)

---

## 1. Auth

### `POST /auth/register`
Créer un compte professeur.

**Body**
```json
{
  "name": "Prof Dupont",
  "email": "prof@test.com",
  "password": "password123"
}
```

**Réponse 201**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Prof Dupont",
    "email": "prof@test.com"
  }
}
```

---

### `POST /auth/login`
Connexion professeur.

**Body**
```json
{
  "email": "prof@test.com",
  "password": "password123"
}
```

**Réponse 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Prof Dupont",
    "email": "prof@test.com"
  }
}
```

> 💾 **À faire côté front :** stocker le `token` dans un cookie ou localStorage et l'envoyer dans chaque requête protégée.

---

### `GET /auth/me` 🔒
Récupérer le profil connecté.

**Réponse 200**
```json
{
  "id": "uuid",
  "name": "Prof Dupont",
  "email": "prof@test.com",
  "createdAt": "2026-03-07T12:00:00.000Z"
}
```

---

### `PUT /auth/me` 🔒
Modifier nom ou email.

**Body** *(tous les champs sont optionnels)*
```json
{
  "name": "Prof Martin",
  "email": "nouveau@email.com"
}
```

**Réponse 200**
```json
{
  "id": "uuid",
  "name": "Prof Martin",
  "email": "nouveau@email.com"
}
```

---

### `PUT /auth/password` 🔒
Changer le mot de passe.

**Body**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Réponse 200**
```json
{ "message": "Mot de passe mis à jour" }
```

---

### `POST /auth/logout` 🔒
Logout (côté serveur stateless — supprimer le token côté client).

**Réponse 200**
```json
{ "message": "Déconnecté" }
```

---

## 2. Formulaires

> Toutes ces routes nécessitent le token JWT. 🔒

---

### `GET /forms`
Liste tous les formulaires du prof connecté.

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "title": "Évaluation Maths",
    "description": "Formulaire de fin de chapitre",
    "token": "uuid-public",
    "isOpen": true,
    "createdAt": "2026-03-07T12:00:00.000Z",
    "_count": {
      "responses": 24,
      "questions": 4
    }
  }
]
```

---

### `GET /forms/:id`
Détail d'un formulaire avec ses questions.

**Réponse 200**
```json
{
  "id": "uuid",
  "title": "Évaluation Maths",
  "description": "...",
  "token": "uuid-public",
  "isOpen": true,
  "createdAt": "2026-03-07T12:00:00.000Z",
  "questions": [
    {
      "id": "uuid",
      "type": "multiple_choice",
      "label": "Quelle partie était difficile ?",
      "options": ["Algèbre", "Géométrie", "Probabilités"],
      "required": true,
      "order": 0
    }
  ]
}
```

---

### `POST /forms`
Créer un formulaire. Les questions sont optionnelles — on peut les ajouter plus tard.

**Body**
```json
{
  "title": "Évaluation Maths",
  "description": "Formulaire de fin de chapitre",
  "questions": [
    {
      "type": "yes_no",
      "label": "Avez-vous compris le cours ?",
      "required": true,
      "order": 0
    },
    {
      "type": "multiple_choice",
      "label": "Quelle partie était difficile ?",
      "options": ["Algèbre", "Géométrie", "Probabilités"],
      "required": true,
      "order": 1
    },
    {
      "type": "rating",
      "label": "Notez la clarté du cours de 1 à 5",
      "required": true,
      "order": 2
    },
    {
      "type": "open",
      "label": "Qu'est-ce qui pourrait être amélioré ?",
      "required": false,
      "order": 3
    }
  ]
}
```

**Types de questions disponibles**

| Type | Description | Champ `options` |
|---|---|---|
| `yes_no` | Oui / Non | Non requis |
| `multiple_choice` | Choix parmi des options | Requis |
| `rating` | Note numérique (1 à 5) | Non requis |
| `open` | Réponse texte libre | Non requis |

**Réponse 201** — retourne le formulaire complet avec ses questions.

---

### `PUT /forms/:id`
Modifier le titre ou la description.

**Body** *(optionnels)*
```json
{
  "title": "Nouveau titre",
  "description": "Nouvelle description"
}
```

**Réponse 200** — retourne le formulaire mis à jour.

---

### `PATCH /forms/:id/toggle`
Ouvrir ou fermer un formulaire. Si ouvert → ferme. Si fermé → ouvre.

**Réponse 200**
```json
{ "isOpen": false }
```

> ⚠️ Un formulaire fermé renvoie une erreur 403 quand un élève essaie d'y répondre.

---

### `DELETE /forms/:id`
Supprimer un formulaire et toutes ses données (questions, réponses).

**Réponse 200**
```json
{ "message": "Formulaire supprimé" }
```

---

## 3. Questions

> Toutes ces routes nécessitent le token JWT. 🔒

---

### `POST /forms/:id/questions`
Ajouter une question à un formulaire existant.

**Body**
```json
{
  "type": "multiple_choice",
  "label": "Quel est votre niveau ?",
  "options": ["Débutant", "Intermédiaire", "Avancé"],
  "required": true
}
```

**Réponse 201** — retourne la question créée.

---

### `PUT /forms/:id/questions/:qid`
Modifier une question.

**Body** *(tous les champs sont optionnels)*
```json
{
  "label": "Nouveau libellé",
  "options": ["Option A", "Option B", "Option C"],
  "required": false
}
```

**Réponse 200** — retourne la question mise à jour.

---

### `PUT /forms/:id/questions/reorder`
Réordonner les questions (drag & drop).

**Body**
```json
{
  "questions": [
    { "id": "uuid-question-1", "order": 0 },
    { "id": "uuid-question-2", "order": 1 },
    { "id": "uuid-question-3", "order": 2 }
  ]
}
```

**Réponse 200**
```json
{ "message": "Ordre mis à jour" }
```

---

### `DELETE /forms/:id/questions/:qid`
Supprimer une question.

**Réponse 200**
```json
{ "message": "Question supprimée" }
```

---

## 4. Réponses élèves — Routes publiques

> Ces routes sont **publiques**, pas besoin de token JWT.  
> L'élève accède au formulaire via un lien contenant le `token` du formulaire.

**Lien à envoyer aux élèves :**
```
http://localhost:3000/respond/<token>
```
Le `token` est disponible dans l'objet formulaire (`form.token`).

---

### `GET /respond/:token`
Récupérer le formulaire public (vue élève — sans infos sensibles).

**Réponse 200**
```json
{
  "id": "uuid",
  "title": "Évaluation Maths",
  "description": "Formulaire de fin de chapitre",
  "questions": [
    {
      "id": "uuid",
      "type": "yes_no",
      "label": "Avez-vous compris le cours ?",
      "options": [],
      "required": true,
      "order": 0
    }
  ]
}
```

**Erreurs possibles**
- `404` — formulaire introuvable
- `403` — formulaire fermé

---

### `POST /respond/:token`
Soumettre les réponses d'un élève.

**Body**
```json
{
  "answers": [
    { "questionId": "uuid-q1", "value": true },
    { "questionId": "uuid-q2", "value": "Algèbre" },
    { "questionId": "uuid-q3", "value": 4 },
    { "questionId": "uuid-q4", "value": "Le cours allait trop vite" }
  ]
}
```

**Format des valeurs selon le type de question**

| Type | Format de `value` |
|---|---|
| `yes_no` | `true` ou `false` |
| `multiple_choice` | `"string"` ou `["string", "string"]` si plusieurs |
| `rating` | `number` (ex: `4`) |
| `open` | `"string"` |

**Réponse 201**
```json
{
  "message": "Réponse enregistrée",
  "responseId": "uuid"
}
```

---

## 5. Réponses — Vue prof

> Toutes ces routes nécessitent le token JWT. 🔒

---

### `GET /forms/:id/responses`
Liste toutes les réponses d'un formulaire.

**Réponse 200**
```json
[
  {
    "id": "uuid",
    "formId": "uuid",
    "submittedAt": "2026-03-07T14:00:00.000Z",
    "answers": [
      {
        "id": "uuid",
        "questionId": "uuid",
        "value": true,
        "question": {
          "label": "Avez-vous compris le cours ?",
          "type": "yes_no"
        }
      }
    ]
  }
]
```

---

### `GET /forms/:id/responses/:rid`
Détail d'une réponse individuelle.

**Réponse 200** — même structure qu'un élément de la liste ci-dessus.

---

### `DELETE /forms/:id/responses/:rid`
Supprimer une réponse.

**Réponse 200**
```json
{ "message": "Réponse supprimée" }
```

---

## 6. Analytics

> Données pré-calculées, prêtes pour Recharts. 🔒

---

### `GET /forms/:id/analytics`
Statistiques complètes de toutes les questions.

**Réponse 200**
```json
{
  "formId": "uuid",
  "title": "Évaluation Maths",
  "totalResponses": 25,
  "analytics": [
    {
      "questionId": "uuid",
      "label": "Avez-vous compris le cours ?",
      "type": "yes_no",
      "totalAnswers": 25,
      "distribution": { "yes": 18, "no": 7 },
      "chart": [
        { "label": "Oui", "count": 18, "percentage": 72 },
        { "label": "Non", "count": 7, "percentage": 28 }
      ]
    },
    {
      "questionId": "uuid",
      "label": "Notez la clarté du cours",
      "type": "rating",
      "totalAnswers": 25,
      "average": 3.8,
      "min": 1,
      "max": 5,
      "distribution": { "1": 1, "2": 3, "3": 6, "4": 10, "5": 5 },
      "chart": [
        { "label": "1", "count": 1, "percentage": 4 },
        { "label": "2", "count": 3, "percentage": 12 },
        { "label": "3", "count": 6, "percentage": 24 },
        { "label": "4", "count": 10, "percentage": 40 },
        { "label": "5", "count": 5, "percentage": 20 }
      ]
    },
    {
      "questionId": "uuid",
      "label": "Qu'est-ce qui pourrait être amélioré ?",
      "type": "open",
      "totalAnswers": 25,
      "answers": [
        "Le cours allait trop vite",
        "Plus d'exercices pratiques",
        "..."
      ]
    }
  ]
}
```

> 💡 **Usage Recharts :** passer directement `analytics[i].chart` au composant `<BarChart data={...}>`.  
> Pour les questions `open`, utiliser la route IA `/insights/:qid` pour obtenir un `chart` groupé par thème.

---

### `GET /forms/:id/analytics/:qid`
Stats d'une seule question.

**Réponse 200** — retourne uniquement l'objet analytics de cette question (même structure que ci-dessus).

---

## 7. IA — Insights

> Appels à Groq, peut prendre 2-5 secondes. Afficher un loader. 🔒

---

### `GET /forms/:id/insights`
Analyse globale du formulaire par l'IA.

**Réponse 200**
```json
{
  "summary": "Les élèves comprennent globalement bien les bases mais rencontrent des difficultés sur la partie théorique.",
  "strengths": [
    "Bonne compréhension des concepts de base",
    "Participation active"
  ],
  "weaknesses": [
    "Difficultés sur le chapitre 3",
    "Rythme perçu comme trop rapide"
  ],
  "suggestions": [
    "Ralentir sur la partie théorique",
    "Ajouter des exercices pratiques",
    "Revoir le chapitre 3 avec plus d'exemples"
  ],
  "openAnswersSummary": [
    {
      "questionLabel": "Qu'est-ce qui pourrait être amélioré ?",
      "themes": [
        {
          "theme": "Rythme trop rapide",
          "count": 10,
          "examples": ["Le cours allait trop vite", "On va trop vite"]
        }
      ],
      "globalSentiment": "mitigé"
    }
  ]
}
```

---

### `GET /forms/:id/insights/:qid`
Analyse approfondie d'une question ouverte. Retourne un `chart` utilisable directement dans Recharts.

> ⚠️ **Uniquement pour les questions de type `open`.** Retourne 400 pour les autres types.

**Réponse 200**
```json
{
  "questionLabel": "Qu'est-ce qui pourrait être amélioré ?",
  "totalAnswers": 25,
  "themes": [
    {
      "theme": "Rythme trop rapide",
      "count": 10,
      "examples": ["Le cours allait trop vite", "On va trop vite"]
    },
    {
      "theme": "Manque d'exercices",
      "count": 8,
      "examples": ["Plus d'exercices pratiques", "Besoin de plus de pratique"]
    }
  ],
  "globalSentiment": "négatif",
  "suggestion": "Revoir le rythme du cours et ajouter des exercices pratiques",
  "chart": [
    { "label": "Rythme trop rapide", "count": 10, "percentage": 40 },
    { "label": "Manque d'exercices", "count": 8, "percentage": 32 },
    { "label": "Autres", "count": 7, "percentage": 28 }
  ]
}
```

---

## 8. Codes d'erreur

| Code | Signification |
|---|---|
| `400` | Données invalides ou manquantes |
| `401` | Token manquant ou invalide |
| `403` | Accès refusé (formulaire fermé, ou ressource d'un autre user) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex: email déjà utilisé) |
| `500` | Erreur serveur |

**Format d'erreur standard**
```json
{ "message": "Description de l'erreur" }
```

---

## Notes importantes

- Le **token JWT** expire après **7 jours**. Rediriger vers `/login` si une requête retourne `401`.
- Le **`token` d'un formulaire** (champ `form.token`) est l'identifiant public pour les élèves — différent de l'`id` du formulaire.
- Les questions `open` ne génèrent pas de graphique directement depuis `/analytics`. Utiliser `/insights/:qid` pour obtenir un `chart` groupé par l'IA.
- Les routes `/insights` peuvent prendre **2 à 5 secondes** — toujours afficher un état de chargement.