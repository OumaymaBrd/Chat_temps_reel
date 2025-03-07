document.addEventListener("DOMContentLoaded", () => {
  // Éléments DOM pour les pages
  const loginPage = document.getElementById("login-page")
  const profilePage = document.getElementById("profile-page")
  const chatPage = document.getElementById("chat-page")
  const callInterface = document.getElementById("call-interface")

  // Éléments DOM pour la page de connexion
  const codeInput = document.getElementById("code-input")
  const accessBtn = document.getElementById("access-btn")
  const errorMessage = document.getElementById("error-message")

  // Éléments DOM pour la page de profil
  const usernameInput = document.getElementById("username-input")
  const startChatBtn = document.getElementById("start-chat-btn")
  const usernameError = document.getElementById("username-error")

  // Éléments DOM pour la page de chat
  const roomCodeSpan = document.getElementById("room-code")
  const chatMessages = document.getElementById("chat-messages")
  const messageInput = document.getElementById("message-input")
  const sendBtn = document.getElementById("send-btn")
  const leaveBtn = document.getElementById("leave-btn")
  const locationBtn = document.getElementById("location-btn")

  // Éléments DOM pour la liste des utilisateurs
  const usersDropdownBtn = document.getElementById("users-dropdown-btn")
  const usersDropdownContent = document.getElementById("users-dropdown-content")
  const usersList = document.getElementById("users-list")

  // Éléments DOM pour la gestion des fichiers
  const fileBtn = document.getElementById("file-btn")
  const fileInput = document.getElementById("file-input")
  const filePreviewContainer = document.getElementById("file-preview-container")
  const filePreviewName = document.getElementById("file-preview-name")
  const filePreviewContent = document.getElementById("file-preview-content")
  const filePreviewClose = document.getElementById("file-preview-close")
  const fileSendBtn = document.getElementById("file-send-btn")

  // Éléments DOM pour le modal d'image
  const imageModal = document.getElementById("image-modal")
  const modalImage = document.getElementById("modal-image")
  const modalClose = document.getElementById("modal-close")

  // Éléments DOM pour l'interface d'appel
  const callStatus = document.getElementById("call-status")
  const callWithUser = document.getElementById("call-with-user")
  const localVideo = document.getElementById("local-video")
  const remoteVideo = document.getElementById("remote-video")
  const remotePlaceholder = document.getElementById("remote-placeholder")
  const toggleAudioBtn = document.getElementById("toggle-audio-btn")
  const toggleVideoBtn = document.getElementById("toggle-video-btn")
  const endCallBtn = document.getElementById("end-call-btn")

  // Éléments DOM pour le modal d'appel entrant
  const incomingCallModal = document.getElementById("incoming-call-modal")
  const callerName = document.getElementById("caller-name")
  const acceptCallBtn = document.getElementById("accept-call-btn")
  const rejectCallBtn = document.getElementById("reject-call-btn")

  // Variables globales
  let currentCode = ""
  let username = ""
  let currentFile = null
  let currentFileData = null
  let currentFileType = null
  let onlineUsers = []

  // Variables pour WebRTC
  let localStream = null
  let peerConnection = null
  let remoteStream = null
  let isCallActive = false
  let isAudioMuted = false
  let isVideoOff = false
  let incomingOffer = null
  let incomingCaller = null
  let currentCallTarget = null
  let callStartTime = null
  let callDuration = 0
  let callTimer = null
  const mediaDeviceRetries = 0
  const MAX_MEDIA_RETRIES = 3

  // Configuration ICE pour WebRTC
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  }

  // Initialisation de Socket.IO avec des options de reconnexion
  const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  })

  socket.on("connect_error", (error) => {
    console.error("Erreur de connexion:", error)
    errorMessage.textContent = "Erreur de connexion au serveur"
  })

  // Son d'appel
  let callSound = null

  function playCallSound() {
    // Créer un élément audio pour le son d'appel
    if (!callSound) {
      callSound = new Audio()
      callSound.src =
        "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwMD09PT09PUxMTExMWFhYWFhYZGRkZGRkcHBwcHB8fHx8fHyIiIiIiJSUlJSUlKCgoKCgrKysrKysuLi4uLjEyMjIyMjU1NTU1NTg4ODg4ODw8PDw8PD8/Pz8/P4AAAAAAAAAAABMYXZmNTguMTIuMTAwAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tA5AAAAn4Tv4UlIAKwMXv5YygAUAY1e5lIAA4BxK9zKQAEAAAJAOAOByDjMHMTNhGXohKGH/nBGXohKGH/AAcA4FA4BwOAcDgHDgAAAAAJAOAcDgcA4HA4BwOAcAAAAAAGCgwSn/E5/iwIG4242k//+LBCXE5//iwQlxOYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    }

    callSound.loop = true
    callSound.play()
  }

  function stopCallSound() {
    if (callSound) {
      callSound.pause()
      callSound.currentTime = 0
    }
  }

  // Vérification des données sauvegardées
  const savedCode = localStorage.getItem("chatCode")
  const savedUsername = localStorage.getItem("chatUsername")

  if (savedCode && savedUsername) {
    currentCode = savedCode
    username = savedUsername
    verifyCode(savedCode)
  }

  function verifyCode(code) {
    if (!code || code.trim() === "") {
      errorMessage.textContent = "Veuillez entrer un code"
      return
    }

    errorMessage.textContent = "Connexion..."
    accessBtn.disabled = true

    // Vérifier d'abord si le socket est connecté
    if (!socket.connected) {
      console.log("Tentative de reconnexion...")
      socket.connect()
    }

    socket.emit("verify-code", code)
  }

  // Événements de la page de connexion
  accessBtn.addEventListener("click", () => {
    const code = codeInput.value.trim()
    verifyCode(code)
  })

  codeInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      const code = codeInput.value.trim()
      verifyCode(code)
    }
  })

  // Événements de la page de profil
  startChatBtn.addEventListener("click", () => {
    const name = usernameInput.value.trim()

    if (!name) {
      usernameError.textContent = "Veuillez entrer un nom d'utilisateur"
      return
    }

    username = name
    localStorage.setItem("chatUsername", name)

    // Enregistrer l'utilisateur auprès du serveur
    socket.emit("register-user", {
      code: currentCode,
      username: username,
    })

    // Navigation vers la page de chat
    profilePage.classList.add("hidden")
    chatPage.classList.remove("hidden")
    roomCodeSpan.textContent = currentCode

    // Chargement de l'historique et focus sur l'input
    loadChatHistory()
    messageInput.focus()
  })

  // Événements de la page de chat
  sendBtn.addEventListener("click", sendMessage)

  messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  })

  leaveBtn.addEventListener("click", () => {
    // Si un appel est en cours, le terminer
    if (isCallActive) {
      endCall()
    }

    // Nettoyage des données et retour à la page de connexion
    localStorage.removeItem("chatCode")

    chatPage.classList.add("hidden")
    loginPage.classList.remove("hidden")

    codeInput.value = ""
    messageInput.value = ""
    chatMessages.innerHTML = ""
    currentCode = ""
  })

  // Événements pour la liste des utilisateurs
  usersDropdownBtn.addEventListener("click", () => {
    usersDropdownContent.classList.toggle("hidden")
  })

  // Fermer le dropdown quand on clique ailleurs
  document.addEventListener("click", (event) => {
    if (!usersDropdownBtn.contains(event.target) && !usersDropdownContent.contains(event.target)) {
      usersDropdownContent.classList.add("hidden")
    }
  })

  // Événements pour la localisation
  locationBtn.addEventListener("click", shareLocation)

  // Événements pour la gestion des fichiers
  fileBtn.addEventListener("click", () => {
    fileInput.click()
  })

  fileInput.addEventListener("change", handleFileSelect)

  filePreviewClose.addEventListener("click", () => {
    closeFilePreview()
  })

  fileSendBtn.addEventListener("click", sendFile)

  // Événements pour le modal d'image
  modalClose.addEventListener("click", () => {
    imageModal.classList.add("hidden")
  })

  // Événements pour les appels
  endCallBtn.addEventListener("click", endCall)
  toggleAudioBtn.addEventListener("click", toggleAudio)
  toggleVideoBtn.addEventListener("click", toggleVideo)
  acceptCallBtn.addEventListener("click", acceptIncomingCall)
  rejectCallBtn.addEventListener("click", rejectIncomingCall)

  // Événements Socket.IO
  socket.on("connect", () => {
    console.log("Connecté au serveur")
  })

  socket.on("disconnect", () => {
    console.log("Déconnecté du serveur")

    // Si un appel est en cours, le terminer
    if (isCallActive) {
      cleanupCall()
      updateCallStatus("Déconnecté du serveur")
    }
  })

  socket.on("code-verified", (data) => {
    accessBtn.disabled = false

    if (data.valid) {
      errorMessage.textContent = ""
      localStorage.setItem("chatCode", data.code)
      currentCode = data.code

      if (username) {
        // Si l'utilisateur a déjà un nom, on l'enregistre
        socket.emit("register-user", {
          code: currentCode,
          username: username,
        })

        loginPage.classList.add("hidden")
        chatPage.classList.remove("hidden")
        roomCodeSpan.textContent = currentCode
        loadChatHistory()
      } else {
        // Sinon, on va à la page de profil
        loginPage.classList.add("hidden")
        profilePage.classList.remove("hidden")
        usernameInput.focus()
      }
    } else {
      errorMessage.textContent = "Code invalide"
    }
  })

  socket.on("reconnect", (attemptNumber) => {
    console.log("Reconnecté au serveur après", attemptNumber, "tentatives")
    if (currentCode) {
      verifyCode(currentCode)
    }
  })

  socket.on("chat-message", (data) => {
    if (data.sender !== username) {
      addMessageToChat(data)
    }
  })

  socket.on("error", (data) => {
    console.error("Erreur serveur:", data.message)
    alert("Erreur: " + data.message)
  })

  socket.on("user-joined", (data) => {
    // Afficher un message système quand un utilisateur rejoint
    const systemMessage = {
      message: `${data.username} a rejoint la conversation`,
      sender: "Système",
      timestamp: new Date().toISOString(),
    }
    addSystemMessage(systemMessage)
  })

  socket.on("user-left", (data) => {
    // Afficher un message système quand un utilisateur quitte
    const systemMessage = {
      message: `${data.username} a quitté la conversation`,
      sender: "Système",
      timestamp: new Date().toISOString(),
    }
    addSystemMessage(systemMessage)

    // Si un appel est en cours avec cet utilisateur, le terminer
    if (isCallActive && (incomingCaller === data.username || currentCallTarget === data.username)) {
      cleanupCall()
      updateCallStatus("L'autre participant a quitté l'appel")
      setTimeout(() => {
        callInterface.classList.add("hidden")
        isCallActive = false
        currentCallTarget = null
      }, 2000)
    }
  })

  socket.on("users-list", (users) => {
    // Mettre à jour la liste des utilisateurs
    onlineUsers = users.filter((user) => user !== username)
    updateUsersList()
  })

  // Événements WebRTC
  socket.on("incoming-call", (data) => {
    if (isCallActive) {
      // Déjà en appel, rejeter automatiquement
      socket.emit("call-answer", {
        code: currentCode,
        answer: null, // null signifie rejet
        answerer: username,
        caller: data.caller,
      })
      return
    }

    // Jouer un son de notification
    playCallSound()

    // Afficher le modal d'appel entrant
    incomingOffer = data.offer
    incomingCaller = data.caller
    callerName.textContent = data.caller
    incomingCallModal.classList.remove("hidden")
  })

  socket.on("call-answered", (data) => {
    if (!isCallActive) return

    if (data.answer === null) {
      // Appel rejeté
      cleanupCall()
      updateCallStatus("Appel rejeté")
      setTimeout(() => {
        callInterface.classList.add("hidden")
        isCallActive = false
        currentCallTarget = null
      }, 2000)
      return
    }

    // Définir la réponse distante
    peerConnection
      .setRemoteDescription(new RTCSessionDescription(data.answer))
      .then(() => {
        updateCallStatus("Connecté")
        remotePlaceholder.style.display = "none"

        // Démarrer le chronomètre d'appel
        startCallTimer()
      })
      .catch((error) => {
        console.error("Erreur lors de la définition de la réponse distante:", error)
        endCall()
      })
  })

  socket.on("ice-candidate", (data) => {
    if (!peerConnection) return

    // Ajouter le candidat ICE
    const candidate = new RTCIceCandidate(data.candidate)
    peerConnection.addIceCandidate(candidate).catch((error) => {
      console.error("Erreur lors de l'ajout du candidat ICE:", error)
    })
  })

  socket.on("call-ended", (data) => {
    if (!isCallActive) return

    // L'autre participant a terminé l'appel
    const otherUser = data.username
    const callDurationFormatted = formatCallDuration(callDuration)

    cleanupCall()
    updateCallStatus("Appel terminé par " + otherUser)

    // Ajouter un message système pour l'appel terminé
    const systemMessage = {
      message: `Appel terminé avec ${otherUser}. Durée: ${callDurationFormatted}`,
      sender: "Système",
      timestamp: new Date().toISOString(),
    }
    addSystemMessage(systemMessage)

    setTimeout(() => {
      callInterface.classList.add("hidden")
      isCallActive = false
      currentCallTarget = null
    }, 2000)
  })

  // Fonctions utilitaires

  function sendMessage() {
    const message = messageInput.value.trim()
    if (!message) return

    const messageData = {
      code: currentCode,
      message: message,
      sender: username,
      timestamp: new Date().toISOString(),
    }

    // Ajouter le message à notre propre chat
    addMessageToChat(messageData, true)

    socket.emit("chat-message", messageData)

    messageInput.value = ""
    messageInput.focus()
  }

  async function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    // Vérification de la taille du fichier
    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. La taille maximale est de 5MB.")
      fileInput.value = ""
      return
    }

    // Vérification du type de fichier
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Type de fichier non supporté. Veuillez sélectionner une image ou un PDF.")
      fileInput.value = ""
      return
    }

    currentFile = file
    filePreviewName.textContent = file.name

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'upload")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de l'upload")
      }

      currentFileData = data.file.url
      currentFileType = data.file.type

      // Affichage de la prévisualisation
      filePreviewContent.innerHTML = ""

      if (data.file.type.startsWith("image/")) {
        const img = document.createElement("img")
        img.src = data.file.url
        img.alt = data.file.name
        filePreviewContent.appendChild(img)
      } else if (data.file.type === "application/pdf") {
        const iframe = document.createElement("iframe")
        iframe.src = data.file.url
        filePreviewContent.appendChild(iframe)
      }

      filePreviewContainer.classList.remove("hidden")
    } catch (error) {
      console.error("Erreur:", error)
      alert(error.message || "Erreur lors de l'upload du fichier")
      closeFilePreview()
    }
  }

  function closeFilePreview() {
    filePreviewContainer.classList.add("hidden")
    filePreviewContent.innerHTML = ""
    fileInput.value = ""
    currentFile = null
    currentFileData = null
    currentFileType = null
  }

  function sendFile() {
    if (!currentFile || !currentFileData) return

    const fileMessage = `FILE:${currentFileType}:${currentFile.name}:${currentFileData}`

    const messageData = {
      code: currentCode,
      message: fileMessage,
      sender: username,
      timestamp: new Date().toISOString(),
    }

    // Ajouter le message à notre propre chat
    addMessageToChat(messageData, true)

    socket.emit("chat-message", messageData)

    closeFilePreview()
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas prise en charge par votre navigateur")
      return
    }

    locationBtn.disabled = true
    locationBtn.style.opacity = "0.5"

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        const messageData = {
          code: currentCode,
          message: `LOCATION:${latitude},${longitude}`,
          sender: username,
          timestamp: new Date().toISOString(),
        }

        // Ajouter le message à notre propre chat
        addMessageToChat(messageData, true)

        socket.emit("chat-message", messageData)

        locationBtn.disabled = false
        locationBtn.style.opacity = "1"
      },
      (error) => {
        let errorMessage
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Vous avez refusé l'accès à votre position."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Votre position n'est pas disponible."
            break
          case error.TIMEOUT:
            errorMessage = "La demande de localisation a expiré."
            break
          default:
            errorMessage = "Une erreur inconnue est survenue."
        }
        alert(errorMessage)

        locationBtn.disabled = false
        locationBtn.style.opacity = "1"
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  function addMessageToChat(data, isSelf = false) {
    const messageDiv = document.createElement("div")
    messageDiv.classList.add("message")
    messageDiv.classList.add(isSelf ? "sent" : "received")

    const messageContent = document.createElement("div")

    if (data.message.startsWith("LOCATION:")) {
      // Message de localisation
      messageDiv.classList.add("location-message")

      const coords = data.message.replace("LOCATION:", "").split(",")
      const latitude = coords[0]
      const longitude = coords[1]

      const mapLink = document.createElement("a")
      mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`
      mapLink.target = "_blank"
      mapLink.classList.add("location-link")
      mapLink.textContent = "Voir sur la carte"

      messageContent.textContent = "A partagé sa localisation:"
      messageDiv.appendChild(messageContent)
      messageDiv.appendChild(mapLink)
    } else if (data.message.startsWith("FILE:")) {
      // Message de fichier
      messageDiv.classList.add("file-message")

      const fileInfo = data.message.split(":")
      const fileType = fileInfo[1]
      const fileName = fileInfo[2]
      const fileUrl = fileInfo[3]

      messageContent.textContent = `A partagé un fichier: ${fileName}`
      messageDiv.appendChild(messageContent)

      if (fileType.startsWith("image/")) {
        const img = document.createElement("img")
        img.src = fileUrl
        img.alt = fileName
        img.classList.add("file-preview")

        img.addEventListener("click", () => {
          modalImage.src = fileUrl
          imageModal.classList.remove("hidden")
        })

        messageDiv.appendChild(img)
      } else if (fileType === "application/pdf") {
        const pdfLink = document.createElement("a")
        pdfLink.href = fileUrl
        pdfLink.target = "_blank"
        pdfLink.classList.add("file-link")
        pdfLink.textContent = "Ouvrir le PDF"
        messageDiv.appendChild(pdfLink)

        const pdfEmbed = document.createElement("iframe")
        pdfEmbed.src = fileUrl
        pdfEmbed.classList.add("pdf-embed")
        messageDiv.appendChild(pdfEmbed)
      }
    } else {
      // Message texte normal
      messageContent.textContent = data.message
      messageDiv.appendChild(messageContent)
    }

    const messageInfo = document.createElement("div")
    messageInfo.classList.add("message-info")

    const timestamp = new Date(data.timestamp)
    const timeString = timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    messageInfo.textContent = `${isSelf ? "Vous" : data.sender} • ${timeString}`
    messageDiv.appendChild(messageInfo)

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight

    saveChatMessage(data, isSelf)
  }

  function addSystemMessage(data) {
    const messageDiv = document.createElement("div")
    messageDiv.classList.add("message", "system-message")
    messageDiv.style.backgroundColor = "#f8f9fa"
    messageDiv.style.color = "#6c757d"
    messageDiv.style.textAlign = "center"
    messageDiv.style.margin = "10px auto"
    messageDiv.style.maxWidth = "80%"
    messageDiv.style.padding = "8px 12px"
    messageDiv.style.borderRadius = "8px"

    const messageContent = document.createElement("div")
    messageContent.textContent = data.message
    messageDiv.appendChild(messageContent)

    const messageInfo = document.createElement("div")
    messageInfo.classList.add("message-info")
    messageInfo.style.textAlign = "center"

    const timestamp = new Date(data.timestamp)
    const timeString = timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    messageInfo.textContent = `${timeString}`
    messageDiv.appendChild(messageInfo)

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  function saveChatMessage(data, isSelf) {
    const chatHistory = JSON.parse(localStorage.getItem(`chat_${currentCode}`) || "[]")

    chatHistory.push({
      ...data,
      isSelf,
    })

    if (chatHistory.length > 100) {
      chatHistory.shift()
    }

    localStorage.setItem(`chat_${currentCode}`, JSON.stringify(chatHistory))
  }

  function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem(`chat_${currentCode}`) || "[]")

    chatHistory.forEach((message) => {
      addMessageToChat(message, message.isSelf)
    })
  }

  function updateUsersList() {
    // Vider la liste actuelle
    usersList.innerHTML = ""

    if (onlineUsers.length === 0) {
      const emptyItem = document.createElement("li")
      emptyItem.textContent = "Aucun autre utilisateur en ligne"
      usersList.appendChild(emptyItem)
      return
    }

    // Ajouter chaque utilisateur à la liste
    onlineUsers.forEach((user) => {
      const userItem = document.createElement("li")

      const userName = document.createElement("span")
      userName.textContent = user

      const callButton = document.createElement("button")
      callButton.classList.add("call-user-btn")
      callButton.title = `Appeler ${user}`
      callButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
            `

      callButton.addEventListener("click", () => {
        startCall(user)
        usersDropdownContent.classList.add("hidden")
      })

      userItem.appendChild(userName)
      userItem.appendChild(callButton)
      usersList.appendChild(userItem)
    })
  }

  // Fonctions pour les appels WebRTC

  // Fonction pour démarrer le chronomètre d'appel
  function startCallTimer() {
    callStartTime = new Date()
    callDuration = 0

    // Mettre à jour le chronomètre toutes les secondes
    callTimer = setInterval(() => {
      const now = new Date()
      callDuration = Math.floor((now - callStartTime) / 1000)

      // Mettre à jour le statut d'appel avec la durée
      const formattedDuration = formatCallDuration(callDuration)
      updateCallStatus(`Connecté - ${formattedDuration}`)
    }, 1000)
  }

  // Fonction pour formater la durée de l'appel
  function formatCallDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Ajouter cette fonction avant startCall
  async function checkAndReleaseMediaDevices() {
    // Vérifier s'il y a des flux médias actifs dans le navigateur
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        // Si on arrive ici, les périphériques sont disponibles
        // On arrête immédiatement ce flux test
        stream.getTracks().forEach((track) => track.stop())
        return true
      } catch (error) {
        console.warn("Périphériques média non disponibles:", error)
        return false
      }
    }
    return false
  }

  async function startCall(targetUser) {
    try {
      // Nettoyer d'abord les ressources existantes
      cleanupCall(false) // Ne pas cacher l'interface d'appel

      // Vérifier si un appel est déjà en cours
      if (isCallActive && currentCallTarget) {
        alert("Un appel est déjà en cours")
        return
      }

      // Afficher l'interface d'appel
      callInterface.classList.remove("hidden")
      callWithUser.textContent = targetUser
      updateCallStatus("Initialisation de l'appel...")
      isCallActive = true
      currentCallTarget = targetUser

      // Demander l'accès à la caméra et au micro avec gestion d'erreur améliorée
      try {
        // Essayer d'abord avec audio et vidéo
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        })

        localVideo.srcObject = localStream
        document.querySelector(".local-video-wrapper").style.display = "block"
      } catch (mediaError) {
        console.warn("Erreur d'accès à la caméra:", mediaError)

        // Si la vidéo échoue, essayer audio seulement
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })

          console.log("Mode audio uniquement activé")
          document.querySelector(".local-video-wrapper").style.display = "none"
        } catch (audioError) {
          console.error("Erreur d'accès au microphone:", audioError)
          throw new Error("Impossible d'accéder aux périphériques média: " + audioError.message)
        }
      }

      // Créer la connexion peer
      createPeerConnection()

      // Ajouter les pistes locales à la connexion
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
      })

      // Créer l'offre
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Envoyer l'offre à l'utilisateur cible
      socket.emit("call-user", {
        code: currentCode,
        targetUsername: targetUser,
        offer: offer,
        caller: username,
      })

      updateCallStatus("Appel en cours...")
    } catch (error) {
      console.error("Erreur lors du démarrage de l'appel:", error)
      alert("Impossible de démarrer l'appel: " + error.message)
      cleanupCall(true)
    }
  }

  function createPeerConnection() {
    peerConnection = new RTCPeerConnection(iceServers)

    // Gérer les candidats ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          code: currentCode,
          candidate: event.candidate,
          sender: username,
          target: currentCallTarget || incomingCaller,
        })
      }
    }

    // Gérer les changements d'état de connexion
    peerConnection.onconnectionstatechange = () => {
      console.log("État de connexion:", peerConnection.connectionState)

      switch (peerConnection.connectionState) {
        case "connected":
          updateCallStatus("Connecté")
          remotePlaceholder.style.display = "none"
          // Démarrer le chronomètre d'appel
          startCallTimer()
          break
        case "disconnected":
        case "failed":
          updateCallStatus("Connexion perdue")
          setTimeout(() => endCall(), 2000)
          break
        case "closed":
          updateCallStatus("Appel terminé")
          break
      }
    }

    // Gérer les pistes entrantes
    peerConnection.ontrack = (event) => {
      console.log("Piste reçue:", event)
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0]
        remoteVideo.srcObject = remoteStream
        remotePlaceholder.style.display = "none"
      }
    }

    // Gérer les changements d'état de la connexion ICE
    peerConnection.oniceconnectionstatechange = () => {
      console.log("État de connexion ICE:", peerConnection.iceConnectionState)

      if (peerConnection.iceConnectionState === "failed" || peerConnection.iceConnectionState === "disconnected") {
        updateCallStatus("Problème de connexion réseau")
      }
    }
  }

  async function acceptIncomingCall() {
    try {
      // Nettoyer d'abord les ressources existantes
      cleanupCall(false) // Ne pas cacher l'interface d'appel

      incomingCallModal.classList.add("hidden")
      stopCallSound()

      // Afficher l'interface d'appel
      callInterface.classList.remove("hidden")
      callWithUser.textContent = incomingCaller
      updateCallStatus("Initialisation de l'appel...")
      isCallActive = true
      currentCallTarget = incomingCaller

      // Demander l'accès à la caméra et au micro avec gestion d'erreur améliorée
      try {
        // Essayer d'abord avec audio et vidéo
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        })

        localVideo.srcObject = localStream
        document.querySelector(".local-video-wrapper").style.display = "block"
      } catch (mediaError) {
        console.warn("Erreur d'accès à la caméra:", mediaError)

        // Si la vidéo échoue, essayer audio seulement
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })

          console.log("Mode audio uniquement activé")
          document.querySelector(".local-video-wrapper").style.display = "none"
        } catch (audioError) {
          console.error("Erreur d'accès au microphone:", audioError)
          throw new Error("Impossible d'accéder aux périphériques média: " + audioError.message)
        }
      }

      // Créer la connexion peer
      createPeerConnection()

      // Ajouter les pistes locales à la connexion
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
      })

      // Définir l'offre distante
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOffer))

      // Créer la réponse
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // Envoyer la réponse
      socket.emit("call-answer", {
        code: currentCode,
        answer: answer,
        answerer: username,
        caller: incomingCaller,
      })

      updateCallStatus("Connexion en cours...")
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'appel:", error)
      alert("Impossible d'accepter l'appel: " + error.message)
      cleanupCall(true)
      incomingCallModal.classList.add("hidden")
    }
  }

  function rejectIncomingCall() {
    incomingCallModal.classList.add("hidden")
    stopCallSound()

    // Envoyer une réponse nulle pour indiquer le rejet
    socket.emit("call-answer", {
      code: currentCode,
      answer: null,
      answerer: username,
      caller: incomingCaller,
    })

    incomingOffer = null
    incomingCaller = null
  }

  function endCall() {
    if (!isCallActive) return

    // Calculer la durée de l'appel
    const callDurationFormatted = formatCallDuration(callDuration)
    const callPartner = currentCallTarget || incomingCaller

    // Informer les autres utilisateurs
    socket.emit("end-call", {
      code: currentCode,
      username: username,
      target: callPartner,
    })

    // Ajouter un message système pour l'appel terminé
    const systemMessage = {
      message: `Appel terminé avec ${callPartner}. Durée: ${callDurationFormatted}`,
      sender: "Système",
      timestamp: new Date().toISOString(),
    }
    addSystemMessage(systemMessage)

    // Nettoyer complètement
    cleanupCall(true)
  }

  function cleanupCall(hideInterface = true) {
    // Arrêter le chronomètre d'appel
    if (callTimer) {
      clearInterval(callTimer)
      callTimer = null
    }

    // Arrêter les flux de manière plus robuste
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop()
      })
      localStream = null
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop()
      })
      remoteStream = null
    }

    // Nettoyer les vidéos
    if (localVideo.srcObject) {
      const tracks = localVideo.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      localVideo.srcObject = null
    }

    if (remoteVideo.srcObject) {
      const tracks = remoteVideo.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      remoteVideo.srcObject = null
    }

    // Fermer la connexion peer
    if (peerConnection) {
      peerConnection.ontrack = null
      peerConnection.onicecandidate = null
      peerConnection.onconnectionstatechange = null
      peerConnection.close()
      peerConnection = null
    }

    // Réinitialiser les vidéos
    remotePlaceholder.style.display = "flex"

    // Réafficher la vidéo locale pour le prochain appel
    document.querySelector(".local-video-wrapper").style.display = "block"

    // Réinitialiser les états
    isAudioMuted = false
    isVideoOff = false
    toggleAudioBtn.classList.remove("muted")
    toggleVideoBtn.classList.remove("muted")

    // Arrêter le son d'appel si nécessaire
    stopCallSound()

    // Cacher l'interface si demandé
    if (hideInterface) {
      callInterface.classList.add("hidden")
      isCallActive = false
      currentCallTarget = null
      incomingCaller = null
      incomingOffer = null
    }

    // Forcer la libération de la mémoire
    if (window.gc) window.gc()
  }

  function toggleAudio() {
    if (!localStream) return

    const audioTracks = localStream.getAudioTracks()
    if (audioTracks.length === 0) return

    isAudioMuted = !isAudioMuted
    audioTracks.forEach((track) => {
      track.enabled = !isAudioMuted
    })

    toggleAudioBtn.classList.toggle("muted", isAudioMuted)
  }

  function toggleVideo() {
    if (!localStream) return

    const videoTracks = localStream.getVideoTracks()
    if (videoTracks.length === 0) return

    isVideoOff = !isVideoOff
    videoTracks.forEach((track) => {
      track.enabled = !isVideoOff
    })

    toggleVideoBtn.classList.toggle("muted", isVideoOff)
  }

  function updateCallStatus(message) {
    callStatus.textContent = message
  }

  function resetCallUI() {
    // Réinitialiser l'interface utilisateur pour un nouvel appel
    callWithUser.textContent = ""
    updateCallStatus("")
    localVideo.srcObject = null
    remoteVideo.srcObject = null
    remotePlaceholder.style.display = "flex"
  }
})

