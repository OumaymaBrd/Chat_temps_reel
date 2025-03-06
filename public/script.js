document.addEventListener("DOMContentLoaded", () => {
    // Éléments DOM
    const loginPage = document.getElementById("login-page")
    const profilePage = document.getElementById("profile-page")
    const chatPage = document.getElementById("chat-page")
  
    const codeInput = document.getElementById("code-input")
    const accessBtn = document.getElementById("access-btn")
    const errorMessage = document.getElementById("error-message")
  
    const usernameInput = document.getElementById("username-input")
    const startChatBtn = document.getElementById("start-chat-btn")
    const usernameError = document.getElementById("username-error")
  
    const roomCodeSpan = document.getElementById("room-code")
    const chatMessages = document.getElementById("chat-messages")
    const messageInput = document.getElementById("message-input")
    const sendBtn = document.getElementById("send-btn")
    const leaveBtn = document.getElementById("leave-btn")
  
    // Éléments pour la localisation
    const locationBtn = document.getElementById("location-btn")
  
    // Éléments pour les fichiers
    const fileBtn = document.getElementById("file-btn")
    const fileInput = document.getElementById("file-input")
    const filePreviewContainer = document.getElementById("file-preview-container")
    const filePreviewName = document.getElementById("file-preview-name")
    const filePreviewContent = document.getElementById("file-preview-content")
    const filePreviewClose = document.getElementById("file-preview-close")
    const fileSendBtn = document.getElementById("file-send-btn")
  
    // Éléments pour le modal d'image
    const imageModal = document.getElementById("image-modal")
    const modalImage = document.getElementById("modal-image")
    const modalClose = document.getElementById("modal-close")
  
    // Variables pour les fichiers
    let currentFile = null
    let currentFileData = null
    let currentFileType = null
  
    // Connexion Socket.io
    const socket = io()
  
    // Variables globales
    let currentCode = ""
    let username = ""
  
    // Vérifier si l'utilisateur a déjà un code et un nom d'utilisateur
    const savedCode = localStorage.getItem("chatCode")
    const savedUsername = localStorage.getItem("chatUsername")
  
    if (savedCode && savedUsername) {
      currentCode = savedCode
      username = savedUsername
      verifyCode(savedCode)
    }
  
    // Événements de la page de connexion
    accessBtn.addEventListener("click", () => {
      const code = codeInput.value.trim()
      if (!code) {
        errorMessage.textContent = "Veuillez entrer un code"
        return
      }
  
      currentCode = code
      verifyCode(code)
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
  
      // Passer à la page de chat
      profilePage.classList.add("hidden")
      chatPage.classList.remove("hidden")
      roomCodeSpan.textContent = currentCode
  
      // Charger l'historique des messages depuis localStorage
      loadChatHistory()
  
      // Focus sur l'input de message
      messageInput.focus()
    })
  
    // Événements de la page de chat
    sendBtn.addEventListener("click", sendMessage)
  
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    })
  
    leaveBtn.addEventListener("click", () => {
      // Supprimer les données de session
      localStorage.removeItem("chatCode")
  
      // Retourner à la page de connexion
      chatPage.classList.add("hidden")
      loginPage.classList.remove("hidden")
  
      // Réinitialiser les champs
      codeInput.value = ""
      messageInput.value = ""
      chatMessages.innerHTML = ""
      currentCode = ""
    })
  
    // Événements pour la localisation
    locationBtn.addEventListener("click", shareLocation)
  
    // Événements pour les fichiers
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
  
    // Fonctions
    function verifyCode(code) {
      socket.emit("verify-code", code)
    }
  
    function sendMessage() {
      const message = messageInput.value.trim()
      if (!message) return
  
      // Envoyer le message au serveur
      socket.emit("chat-message", {
        code: currentCode,
        message,
        sender: username,
      })
  
      // Effacer l'input
      messageInput.value = ""
      messageInput.focus()
    }
  
    function addMessageToChat(data, isSelf = false) {
      const messageDiv = document.createElement("div")
      messageDiv.classList.add("message")
      messageDiv.classList.add(isSelf ? "sent" : "received")
  
      const messageContent = document.createElement("div")
  
      // Vérifier le type de message
      if (data.message.startsWith("LOCATION:")) {
        // Message de localisation
        messageDiv.classList.add("location-message")
  
        const coords = data.message.replace("LOCATION:", "").split(",")
        const latitude = coords[0]
        const longitude = coords[1]
  
        // Créer un lien Google Maps
        const mapLink = document.createElement("a")
        mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`
        mapLink.target = "_blank"
        mapLink.classList.add("location-link")
        mapLink.textContent = "Voir sur la carte"
  
        // Ajouter une description
        messageContent.textContent = "A partagé sa localisation:"
        messageDiv.appendChild(messageContent)
        messageDiv.appendChild(mapLink)
      } else if (data.message.startsWith("FILE:")) {
        // Message de fichier
        messageDiv.classList.add("file-message")
  
        // Format: FILE:type:name:data
        const fileInfo = data.message.split(":")
        const fileType = fileInfo[1]
        const fileName = fileInfo[2]
        const fileData = data.message.substring(fileInfo[0].length + fileInfo[1].length + fileInfo[2].length + 3) // +3 pour les trois ':'
  
        // Ajouter une description
        messageContent.textContent = `A partagé un fichier: ${fileName}`
        messageDiv.appendChild(messageContent)
  
        if (fileType.startsWith("image/")) {
          // Afficher l'image
          const img = document.createElement("img")
          img.src = fileData
          img.alt = fileName
          img.classList.add("file-preview")
          img.addEventListener("click", () => {
            // Afficher l'image en plein écran
            modalImage.src = fileData
            imageModal.classList.remove("hidden")
          })
          messageDiv.appendChild(img)
        } else if (fileType === "application/pdf") {
          // Créer un lien pour ouvrir le PDF
          const pdfLink = document.createElement("a")
          pdfLink.href = fileData
          pdfLink.target = "_blank"
          pdfLink.classList.add("file-link")
          pdfLink.textContent = "Ouvrir le PDF"
          messageDiv.appendChild(pdfLink)
  
          // Ajouter un aperçu du PDF si possible
          try {
            const pdfEmbed = document.createElement("iframe")
            pdfEmbed.src = fileData
            pdfEmbed.classList.add("pdf-embed")
            messageDiv.appendChild(pdfEmbed)
          } catch (error) {
            console.error("Erreur lors de l'affichage du PDF:", error)
          }
        }
      } else {
        // Message texte normal
        messageContent.textContent = data.message
        messageDiv.appendChild(messageContent)
      }
  
      const messageInfo = document.createElement("div")
      messageInfo.classList.add("message-info")
  
      // Formater l'heure
      const timestamp = new Date(data.timestamp)
      const timeString = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  
      messageInfo.textContent = `${isSelf ? "Vous" : data.sender} • ${timeString}`
      messageDiv.appendChild(messageInfo)
  
      chatMessages.appendChild(messageDiv)
  
      // Scroll vers le bas
      chatMessages.scrollTop = chatMessages.scrollHeight
  
      // Sauvegarder le message dans l'historique
      saveChatMessage(data, isSelf)
    }
  
    function saveChatMessage(data, isSelf) {
      // Récupérer l'historique existant ou créer un nouveau
      const chatHistory = JSON.parse(localStorage.getItem(`chat_${currentCode}`) || "[]")
  
      // Ajouter le nouveau message
      chatHistory.push({
        ...data,
        isSelf,
      })
  
      // Limiter l'historique à 100 messages
      if (chatHistory.length > 100) {
        chatHistory.shift()
      }
  
      // Sauvegarder l'historique mis à jour
      localStorage.setItem(`chat_${currentCode}`, JSON.stringify(chatHistory))
    }
  
    function loadChatHistory() {
      const chatHistory = JSON.parse(localStorage.getItem(`chat_${currentCode}`) || "[]")
  
      // Afficher chaque message de l'historique
      chatHistory.forEach((msg) => {
        addMessageToChat(msg, msg.isSelf)
      })
    }
  
    // Fonction pour partager la localisation
    function shareLocation() {
      if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas prise en charge par votre navigateur")
        return
      }
  
      locationBtn.disabled = true
      locationBtn.style.opacity = "0.5"
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Succès - envoyer la position au serveur
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude
  
          // Créer un message avec la localisation
          socket.emit("chat-message", {
            code: currentCode,
            message: `LOCATION:${latitude},${longitude}`,
            sender: username,
          })
  
          locationBtn.disabled = false
          locationBtn.style.opacity = "1"
        },
        (error) => {
          // Erreur
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
  
    // Fonctions pour la gestion des fichiers
    async function handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return
  
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. La taille maximale est de 5MB.")
        fileInput.value = ""
        return
      }
  
      currentFile = file
      filePreviewName.textContent = file.name
  
      try {
        // Créer un FormData pour l'upload
        const formData = new FormData()
        formData.append("file", file)
  
        // Envoyer le fichier au serveur
        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        })
  
        if (!response.ok) {
          throw new Error("Erreur lors de l'upload")
        }
  
        const data = await response.json()
        currentFileData = data.url
        currentFileType = data.type
  
        // Afficher la prévisualisation
        filePreviewContent.innerHTML = ""
  
        if (data.type.startsWith("image/")) {
          // Prévisualisation d'image
          const img = document.createElement("img")
          img.src = data.url
          filePreviewContent.appendChild(img)
        } else if (data.type === "application/pdf") {
          // Prévisualisation de PDF
          const iframe = document.createElement("iframe")
          iframe.src = data.url
          filePreviewContent.appendChild(iframe)
        }
  
        // Afficher le conteneur de prévisualisation
        filePreviewContainer.classList.remove("hidden")
      } catch (error) {
        console.error("Erreur:", error)
        alert("Erreur lors de l'upload du fichier.")
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
  
      // Créer un message avec le fichier
      // Format: FILE:type:name:url
      const fileMessage = `FILE:${currentFileType}:${currentFile.name}:${currentFileData}`
  
      // Envoyer le message au serveur
      socket.emit("chat-message", {
        code: currentCode,
        message: fileMessage,
        sender: username,
      })
  
      // Fermer la prévisualisation
      closeFilePreview()
    }
  
    // Événements Socket.io
    socket.on("code-verified", (data) => {
      if (data.valid) {
        // Sauvegarder le code
        localStorage.setItem("chatCode", data.code)
        currentCode = data.code
  
        // Si l'utilisateur a déjà un nom, aller directement au chat
        if (username) {
          loginPage.classList.add("hidden")
          chatPage.classList.remove("hidden")
          roomCodeSpan.textContent = currentCode
          loadChatHistory()
        } else {
          // Sinon, demander un nom d'utilisateur
          loginPage.classList.add("hidden")
          profilePage.classList.remove("hidden")
          usernameInput.focus()
        }
      } else {
        errorMessage.textContent = "Code invalide"
      }
    })
  
    socket.on("chat-message", (data) => {
      // Ne pas afficher les messages de l'utilisateur actuel (ils sont déjà affichés)
      if (data.sender !== username) {
        addMessageToChat(data)
      }
    })
  
    // Écouter les messages envoyés par l'utilisateur actuel
    socket.on("chat-message", (data) => {
      if (data.sender === username) {
        addMessageToChat(data, true)
      }
    })
  })
  
  