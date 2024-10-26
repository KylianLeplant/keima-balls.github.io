const tokenKey = "TokenCircleGame";
export function vect_unitaire(x,y){
    let r=Math.sqrt(x**2+y**2);S
    //console.log("x,y,r",x,y,r)
    return [x/r,y/r];
};

export function distance(player1,player2){
    return Math.sqrt((player1.x-player2.x)**2+(player1.y-player2.y)**2);
};

// Fonction pour générer un token aléatoire (ici un simple exemple basé sur des caractères aléatoires)
export function generateToken() {
    const randomToken = Math.random().toString(36).substring(2);
    return randomToken;
}

//crée un token
export function getToken(){
    // Tenter de récupérer un token depuis le localStorage

    let token = localStorage.getItem(tokenKey);
    // Si aucun token n'est trouvé, en génère un nouveau et l'enregistre dans localStorage
    if (!token) {
        token = generateToken(); 
        localStorage.setItem(tokenKey, token); 
    }
    return token;
}

//envoie des données au serveur
export function send(data){
    if (socket_open){
        socket.send(data);
    }
    else {
        createSocket();
    }
}



