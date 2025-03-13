
# Taxi Chat Application

Une application de chat en temps réel pour les services de taxi, permettant la communication instantanée et le partage de localisation entre chauffeurs et clients.

## Technologies Utilisées

### 1. Node.js
- Runtime JavaScript côté serveur
- Version recommandée : 18.x ou supérieure
- Gestion asynchrone des connexions multiples
- Excellentes performances pour les applications en temps réel

### 2. Express.js
- Framework web pour Node.js
- Gestion des routes et des middlewares
- Configuration du serveur HTTP
- Intégration facile avec Socket.IO
- API RESTful pour les fonctionnalités non temps réel

### 3. Socket.IO
- Communication bidirectionnelle en temps réel
- Fonctionnalités principales utilisées :
  - Rooms pour les conversations privées
  - Événements personnalisés pour le partage de localisation
  - Reconnexion automatique en cas de perte de connexion
  - Fallback vers le polling HTTP si WebSocket n'est pas disponible

## Fonctionnalités Principales

1. **Chat en Temps Réel**
   - Messages instantanés
   - Indicateurs de statut (en ligne/hors ligne)
   - Historique des conversations
   - Support des messages multimédias

2. **Géolocalisation**
   - Partage de position en temps réel
   - Mise à jour automatique de la localisation
   - Affichage sur carte interactive

3. **Interface Utilisateur**
   - Design responsive
   - Animations fluides
   - Support du mode sombre
   - Interface intuitive pour les chauffeurs et clients

## Installation

```bash
# Cloner le repository
git clone https://github.com/votre-repo/taxi-chat-app.git

# Installer les dépendances
cd taxi-chat-app
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Démarrer le serveur
npm run dev
```

## Structure du Projet

```
taxi-chat-app/
├── client/                 # Frontend React
├── server/                 # Backend Node.js
│   ├── socket/            # Configuration Socket.IO
│   ├── routes/            # Routes Express
│   └── models/            # Modèles de données
├── public/                # Assets statiques
└── package.json          
```

## Configuration Socket.IO

```javascript
// server/socket/index.js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  // Gestion des rooms pour les conversations
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  // Mise à jour de la localisation
  socket.on('update-location', (data) => {
    io.to(data.roomId).emit('location-updated', {
      userId: socket.id,
      location: data.location
    });
  });

  // Messages de chat
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('new-message', {
      userId: socket.id,
      message: data.message,
      timestamp: new Date()
    });
  });
});
```

## Sécurité

- Authentification JWT pour les connexions Socket.IO
- Validation des données entrantes
- Rate limiting pour prévenir les abus
- Encryption des messages sensibles

## Performance

- Mise en cache avec Redis
- Optimisation des connexions WebSocket
- Gestion efficace des événements Socket.IO
- Clustering pour la scalabilité

## Contribution

Les contributions sont les bienvenues ! Consultez notre guide de contribution pour plus de détails.

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.