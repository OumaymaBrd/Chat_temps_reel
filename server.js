// Importation des modules nécessaires
const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const path = require("path")
const multer = require("multer")
const fs = require("fs")

// Création de l'application Express
const app = express()
const server = http.createServer(app)

// Configuration de Socket.IO avec CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000, // Augmenter le timeout pour une meilleure stabilité
})

// Configuration du dossier de stockage pour multer
const uploadDirectory = path.join(__dirname, "public", "uploads")

// Création du dossier uploads s'il n'existe pas
if (!fs.existsSync(uploadDirectory)) {
  try {
    fs.mkdirSync(uploadDirectory, { recursive: true })
    console.log("Dossier uploads créé avec succès")
  } catch (error) {
    console.error("Erreur lors de la création du dossier uploads:", error)
  }
}

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory)
  },
  filename: (req, file, callback) => {
    // Création d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    callback(null, file.fieldname + "-" + uniqueSuffix + extension)
  },
})

// Configuration des filtres pour les types de fichiers acceptés
const fileFilter = (req, file, callback) => {
  // Vérification du type MIME
  if (file.type && (file.type.startsWith("image/") || file.type === "application/pdf")) {
    callback(null, true)
  } else if (file.mimetype && (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf")) {
    callback(null, true)
  } else {
    callback(new Error("Type de fichier non supporté. Seuls les images et les PDF sont acceptés."), false)
  }
}

// Configuration de multer avec les options
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
    files: 1, // Un seul fichier à la fois
  },
})

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")))

// Route pour l'upload de fichiers
app.post("/upload", (req, res) => {
  // Utilisation de multer comme middleware
  upload.single("file")(req, res, (error) => {
    if (error) {
      console.error("Erreur lors de l'upload:", error)

      // Gestion des différents types d'erreurs
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Le fichier est trop volumineux. Taille maximale: 5MB",
          })
        }
        return res.status(400).json({
          error: "Erreur lors de l'upload: " + error.message,
        })
      }

      return res.status(400).json({
        error: error.message || "Erreur lors de l'upload du fichier",
      })
    }

    // Vérification si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        error: "Aucun fichier n'a été envoyé",
      })
    }

    try {
      // Création de l'URL relative pour le fichier
      const fileUrl = "/uploads/" + req.file.filename

      // Envoi de la réponse avec les informations du fichier
      res.json({
        success: true,
        file: {
          url: fileUrl,
          type: req.file.mimetype,
          name: req.file.originalname,
          size: req.file.size,
        },
      })
    } catch (error) {
      console.error("Erreur lors du traitement du fichier:", error)
      res.status(500).json({
        error: "Erreur lors du traitement du fichier",
      })
    }
  })
})

// Stockage des codes d'accès actifs et des utilisateurs
const activeCodes = new Map()
const userSockets = new Map() // Pour suivre les sockets des utilisateurs
const userCalls = new Map() // Pour suivre les appels actifs des utilisateurs
const callDurations = new Map() // Pour suivre les durées d'appel

// Configuration des événements Socket.IO
io.on("connection", (socket) => {
  console.log("Nouvelle connexion client établie:", socket.id)

  // Gestion de la vérification du code d'accès
  socket.on("verify-code", (code) => {
    console.log("Vérification du code:", code)

    try {
      if (!code || typeof code !== "string") {
        socket.emit("code-verified", {
          valid: false,
          error: "Code invalide",
        })
        return
      }

      // Le code existe déjà, rejoindre la salle
      if (activeCodes.has(code)) {
        socket.join(code)
        socket.emit("code-verified", {
          valid: true,
          code: code,
        })
        console.log(`Client a rejoint la salle: ${code}`)
      } else {
        // Création d'une nouvelle salle
        activeCodes.set(code, {
          createdAt: new Date(),
          users: new Map(),
        })
        socket.join(code)
        socket.emit("code-verified", {
          valid: true,
          code: code,
          isNew: true,
        })
        console.log(`Nouvelle salle créée: ${code}`)
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du code:", error)
      socket.emit("code-verified", {
        valid: false,
        error: "Erreur serveur",
      })
    }
  })

  // Enregistrement de l'utilisateur
  socket.on("register-user", (data) => {
    const { code, username } = data

    if (!code || !activeCodes.has(code)) {
      socket.emit("error", { message: "Code de salle invalide" })
      return
    }

    // Enregistrer l'utilisateur dans la salle avec son socketId
    const room = activeCodes.get(code)
    room.users.set(username, socket.id)

    // Associer le socket à l'utilisateur
    userSockets.set(socket.id, { code, username })

    // Informer les autres utilisateurs de la salle
    socket.to(code).emit("user-joined", { username })

    // Envoyer la liste des utilisateurs connectés
    const usersList = Array.from(room.users.keys())
    io.to(code).emit("users-list", usersList)

    console.log(`Utilisateur ${username} enregistré dans la salle ${code} avec socketId ${socket.id}`)
  })

  // Gestion des messages
  socket.on("chat-message", (data) => {
    if (!data.code || !activeCodes.has(data.code)) {
      socket.emit("error", {
        message: "Code de salle invalide",
      })
      return
    }

    // Ajout du timestamp au message
    const messageWithTimestamp = {
      ...data,
      timestamp: new Date().toISOString(),
    }

    // Diffusion du message à tous les clients dans la salle
    io.to(data.code).emit("chat-message", messageWithTimestamp)
  })

  // Gestion des appels WebRTC
  socket.on("call-user", (data) => {
    const { code, targetUsername, offer, caller } = data

    if (!code || !activeCodes.has(code)) {
      socket.emit("error", { message: "Code de salle invalide" })
      return
    }

    const room = activeCodes.get(code)

    // Vérifier si l'utilisateur cible existe
    if (!room.users.has(targetUsername)) {
      socket.emit("error", { message: "Utilisateur cible non trouvé" })
      return
    }

    // Vérifier si l'utilisateur cible est déjà en appel
    if (userCalls.has(targetUsername)) {
      socket.emit("error", { message: "L'utilisateur est déjà en appel" })
      return
    }

    const targetSocketId = room.users.get(targetUsername)
    console.log(`Appel de ${caller} vers ${targetUsername} (socketId: ${targetSocketId}) dans la salle ${code}`)

    // Enregistrer l'appel
    userCalls.set(caller, targetUsername)
    userCalls.set(targetUsername, caller)

    // Initialiser le suivi de la durée d'appel
    const callId = `${caller}-${targetUsername}`
    callDurations.set(callId, {
      startTime: new Date(),
      duration: 0,
    })

    // Envoyer l'offre uniquement à l'utilisateur cible
    io.to(targetSocketId).emit("incoming-call", {
      offer,
      caller,
    })
  })

  socket.on("call-answer", (data) => {
    const { code, answer, answerer, caller } = data

    if (!code || !activeCodes.has(code)) {
      socket.emit("error", { message: "Code de salle invalide" })
      return
    }

    const room = activeCodes.get(code)

    // Vérifier si l'appelant existe
    if (!room.users.has(caller)) {
      socket.emit("error", { message: "Appelant non trouvé" })
      return
    }

    const callerSocketId = room.users.get(caller)
    console.log(`Réponse d'appel de ${answerer} à ${caller} (socketId: ${callerSocketId}) dans la salle ${code}`)

    // Si l'appel est rejeté, nettoyer les données d'appel
    if (answer === null) {
      userCalls.delete(caller)
      userCalls.delete(answerer)

      // Supprimer le suivi de la durée d'appel
      const callId = `${caller}-${answerer}`
      callDurations.delete(callId)
    }

    // Envoyer la réponse uniquement à l'appelant
    io.to(callerSocketId).emit("call-answered", {
      answer,
      answerer,
    })
  })

  socket.on("ice-candidate", (data) => {
    const { code, candidate, sender, target } = data

    if (!code || !activeCodes.has(code)) {
      socket.emit("error", { message: "Code de salle invalide" })
      return
    }

    const room = activeCodes.get(code)

    // Vérifier si la cible existe
    if (!room.users.has(target)) {
      socket.emit("error", { message: "Utilisateur cible non trouvé" })
      return
    }

    const targetSocketId = room.users.get(target)

    // Envoyer le candidat ICE uniquement à l'utilisateur cible
    io.to(targetSocketId).emit("ice-candidate", {
      candidate,
      sender,
    })
  })

  socket.on("end-call", (data) => {
    const { code, username, target } = data

    if (!code || !activeCodes.has(code)) {
      socket.emit("error", { message: "Code de salle invalide" })
      return
    }

    const room = activeCodes.get(code)

    console.log(`Appel terminé par ${username} dans la salle ${code}`)

    // Calculer la durée de l'appel
    let callDurationInfo = null
    const callId1 = `${username}-${target}`
    const callId2 = `${target}-${username}`

    if (callDurations.has(callId1)) {
      callDurationInfo = callDurations.get(callId1)
      callDurations.delete(callId1)
    } else if (callDurations.has(callId2)) {
      callDurationInfo = callDurations.get(callId2)
      callDurations.delete(callId2)
    }

    // Nettoyer les données d'appel
    userCalls.delete(username)
    userCalls.delete(target)

    // Si une cible spécifique est fournie, envoyer uniquement à cette cible
    if (target && room.users.has(target)) {
      const targetSocketId = room.users.get(target)
      io.to(targetSocketId).emit("call-ended", {
        username,
        duration: callDurationInfo ? Math.floor((new Date() - callDurationInfo.startTime) / 1000) : 0,
      })
    } else {
      // Sinon, informer tous les autres utilisateurs que l'appel est terminé
      socket.to(code).emit("call-ended", {
        username,
        duration: callDurationInfo ? Math.floor((new Date() - callDurationInfo.startTime) / 1000) : 0,
      })
    }
  })

  // Gestion de la déconnexion
  socket.on("disconnect", () => {
    console.log("Client déconnecté:", socket.id)

    // Récupérer les informations de l'utilisateur
    const userInfo = userSockets.get(socket.id)
    if (userInfo) {
      const { code, username } = userInfo

      // Supprimer l'utilisateur de la salle
      if (activeCodes.has(code)) {
        const room = activeCodes.get(code)
        room.users.delete(username)

        // Nettoyer les données d'appel
        if (userCalls.has(username)) {
          const otherUser = userCalls.get(username)

          // Calculer la durée de l'appel
          let callDurationInfo = null
          const callId1 = `${username}-${otherUser}`
          const callId2 = `${otherUser}-${username}`

          if (callDurations.has(callId1)) {
            callDurationInfo = callDurations.get(callId1)
            callDurations.delete(callId1)
          } else if (callDurations.has(callId2)) {
            callDurationInfo = callDurations.get(callId2)
            callDurations.delete(callId2)
          }

          userCalls.delete(username)
          userCalls.delete(otherUser)

          // Informer l'autre utilisateur que l'appel est terminé
          if (room.users.has(otherUser)) {
            const otherSocketId = room.users.get(otherUser)
            io.to(otherSocketId).emit("call-ended", {
              username,
              duration: callDurationInfo ? Math.floor((new Date() - callDurationInfo.startTime) / 1000) : 0,
            })
          }
        }

        // Informer les autres utilisateurs
        socket.to(code).emit("user-left", { username })

        // Mettre à jour la liste des utilisateurs
        const usersList = Array.from(room.users.keys())
        io.to(code).emit("users-list", usersList)

        // Si la salle est vide, la supprimer
        if (room.users.size === 0) {
          activeCodes.delete(code)
          console.log(`Salle ${code} supprimée car vide`)
        }
      }

      // Supprimer l'association socket-utilisateur
      userSockets.delete(socket.id)
    }
  })
})

// Fonction de nettoyage des fichiers uploadés
function cleanupUploads() {
  console.log("Début du nettoyage des fichiers uploadés")

  fs.readdir(uploadDirectory, (error, files) => {
    if (error) {
      console.error("Erreur lors de la lecture du dossier uploads:", error)
      return
    }

    const now = Date.now()
    const oneDayInMs = 24 * 60 * 60 * 1000 // 24 heures en millisecondes

    files.forEach((file) => {
      const filePath = path.join(uploadDirectory, file)

      fs.stat(filePath, (error, stats) => {
        if (error) {
          console.error(`Erreur lors de la lecture des stats du fichier ${file}:`, error)
          return
        }

        // Suppression des fichiers plus vieux que 24h
        if (now - stats.mtime.getTime() > oneDayInMs) {
          fs.unlink(filePath, (error) => {
            if (error) {
              console.error(`Erreur lors de la suppression du fichier ${file}:`, error)
            } else {
              console.log(`Fichier supprimé: ${file}`)
            }
          })
        }
      })
    })
  })
}

// Planification du nettoyage toutes les 24h
setInterval(cleanupUploads, 24 * 60 * 60 * 1000)

// Démarrage du serveur
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
  console.log(`Dossier uploads: ${uploadDirectory}`)
})

// Gestion des erreurs non capturées
process.on("uncaughtException", (error) => {
  console.error("Erreur non capturée:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesse rejetée non gérée:", reason)
})

