////////////////////////////////////////////////////////////////////////
//CONSTANTES
////////////////////////////////////////////////////////////////////////

const tokenKey = "TokenCircleGame";
const token = getToken();
const container = document.getElementById('container');
document.body.style.background = "#222222";
let token_serveur = NaN;


////////////////////////////////////////////////////////////////////////
//CLASSES
////////////////////////////////////////////////////////////////////////
class Player{
    constructor(x=100,y=100,is_player=true,player_token,color,size,nb_life){
        // attributs de position, de vitesse et de taille 
        this.x = x;
        this.y = y;
        this.speed_x = 0; 
        this.speed_y = 0;
        this.radius = size/2;
        this.is_player = is_player;
        this.mass = 10;
        this.nb_life = nb_life;

        this.token = player_token;
        this.delta_v = 100;   //mana disponible
        this.coeff_acc = 1500;  //coefficient d'accélération par dash
        this.startTime = 0;
        this.critic_clic_time = 500;

        this.reload_time = 1000;
        this.is_charging = false; // booléen, est ce que le joueur charge son attaque
        this.exhaustion_level = 30;   // est ce que le joueur est en état de fatigue (- de 30 de delta_v)
        this.is_clicked = false;

        // crée élément html
        if (this.nb_life>0){
            this.color = color
            this.circle = document.createElement('div');
            this.circle.style.backgroundColor = this.color.background;
            this.circle.classList.add('circle');
            
            this.circle.style.width = `${2*this.radius}px`;
            this.circle.style.height = `${2*this.radius}px`;
            this.circle.style.left = `${this.x-this.radius}px`;
            this.circle.style.top = `${this.y-this.radius}px`;
            //this.circle.textContent = this.nb_life;
            //this.circle.style.fontSize = `${this.circle.style.width/2}px`;
            container.appendChild(this.circle);


            this.text = document.createElement('span');
            this.text.style.userSelect = 'none';
            this.text.textContent = this.nb_life;  // Ajoute le texte de vie
            this.text.style.position = 'absolute';
            this.text.style.width = '100%';
            this.text.style.height = '100%';
            this.text.style.display = 'flex';
            this.text.style.justifyContent = 'center';
            this.text.style.alignItems = 'center';
            this.text.style.fontSize = `${this.radius*2/3}px`;  // Ajuste la taille du texte selon la taille du cercle
            this.circle.appendChild(this.text);

            this.innerCircle = document.createElement('div');
            this.innerCircle.classList.add('innerCircle');
            this.innerCircle.style.width = `${2*this.radius*this.delta_v/100}px`;
            this.innerCircle.style.height = `${2*this.radius*this.delta_v/100}px`;
            this.innerCircle.style.left = `${this.radius*(1-this.delta_v/100)}px`;  // Centré par rapport au cercle extérieur
            this.innerCircle.style.top = `${this.radius*(1-this.delta_v/100)}px`;   // Centré par rapport au cercle extérieur
            this.circle.appendChild(this.innerCircle);

            //début du clic
            if (is_player){container.addEventListener('mousedown', (e) => {
                if (e.button === 0){
                    this.startTime = Date.now();
                    this.is_clicked = true;
                }
            })}
            // pour pas que le mouvement de la souris empeche l'event mouseup
            //container.addEventListener('mousemove', (event) => {
            //    if (this.is_clicked) {
            //        console.log("Déplacement en cours");
            //        
            //        event.preventDefault();  
            //    }
            //});
            //le joueur change de trajectoire en relachant le clic gauche
            if (is_player){container.addEventListener('mouseup', (e) => {
                if (e.button === 0){
                    //console.log("clic :",e.clientX,e.clientY,"   coord screen :",(this.x-this.radius)*coeff_size+container.clientWidth/2,(this.x-this.radius)*coeff_size+container.clientWidth/2);
                    let dv = this.dash(e.clientX - (this.x-this.radius)*coeff_size-container.clientWidth/2, e.clientY - (this.y-this.radius)*coeff_size-container.clientHeight/2,Date.now()-this.startTime);
                    let type_request = 'dash';
                    if (this.is_clicked){
                        send(JSON.stringify({token,type_request,dvx:dv[0],dvy:dv[1],used_delta_v:dv[2]}));
                    } 
                    this.is_clicked = false;
                }
            })}
        }
    }

    coeffFriction(speed){
        let coeff_static = 12;
        let coeff_min = 9;
        let critic_speed = 8;
        return (coeff_static-coeff_min)*speed/critic_speed;
    };
    

    dash(dx,dy,dt){
        let used_delta_v = Math.min(100*Math.min(dt,this.critic_clic_time)/this.critic_clic_time,this.delta_v);
        this.delta_v -= used_delta_v;
        let coeff_acc = used_delta_v*this.coeff_acc/100;
        if (this.delta_v < this.exhaustion_level){
            coeff_acc /= 3;
        };
        let v = this.normalise(dx,dy);
        let dvx = v[0]*coeff_acc;
        let dvy = v[1]*coeff_acc;
        this.speed_x += dvx;
        this.speed_y += dvy;
        return [dvx,dvy,used_delta_v]
    };

    normalise(x,y){
        let r = Math.sqrt(x**2+y**2);
        return [x/r,y/r];
    };

    death(){
        console.log("mort");
        this.circle.remove();
        this.innerCircle.remove();
    }
};

class Color{
    constructor(background,border,exhaustion){
        this.background = background;
        this.border = border;
        this.exhaustion = exhaustion
    }
}

class Arena{
    constructor(color,radius,x,y,scale_factor){
        this.color = color;
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.scale_factor = scale_factor;
        this.size_screen = Math.min(container.clientWidth/this.scale_factor,container.clientHeight/this.scale_factor);
        //console.log("sizescreen :",this.size_screen,Math.min([container.clientWidth/this.scale_factor,container.clientHeight/this.scale_factor]),[container.clientWidth/this.scale_factor,container.clientHeight/this.scale_factor],container.clientWidth);
        console.log("xy :",x,y);
        this.background_element = document.createElement('div');
        this.background_element.classList.add('arena');
        this.background_element.style.backgroundColor = this.color.background;
        this.background_element.style.width = `${this.radius*2}px`;
        this.background_element.style.height = `${this.radius*2}px`;
        this.background_element.style.left = `${this.x-this.radius}px`;
        this.background_element.style.top = `${this.y-this.radius}px`;
        container.appendChild(this.background_element);        
        
        this.border_element = document.createElement('div');
        this.border_element.classList.add('arenaBorder');
        this.border_element.style.border = "2px solid " + this.color.border;
        this.border_element.style.width = `${this.radius*2}px`;
        this.border_element.style.height = `${this.radius*2}px`;
        this.border_element.style.left = `${0}px`;  // Centré par rapport au cercle extérieur
        this.border_element.style.top = `${0}px`;   // Centré par rapport au cercle extérieur
        this.background_element.appendChild(this.border_element);
    }

    change_size(){
        this.size_screen = Math.min(container.clientWidth*this.scale_factor,container.clientHeight*this.scale_factor);

        this.background_element.style.width = `${this.size_screen}px`;
        this.background_element.style.height = `${this.size_screen}px`;
        this.background_element.style.left = `${this.x*this.size_screen/this.radius/2-this.size_screen/2+container.clientWidth/2}px`;
        this.background_element.style.top = `${this.y*this.size_screen/this.radius/2-this.size_screen/2+container.clientHeight/2}px`;
        
        this.border_element.style.width = `${this.size_screen}px`;
        this.border_element.style.height = `${this.size_screen}px`;
        this.border_element.style.left = `${0}px`;  // Centré par rapport au cercle extérieur
        this.border_element.style.top = `${0}px`;
    }
}

class life{
    constructor(scale_factor){
        this.scale_factor = scale_factor;
        this.size_screen = Math.min(container.clientWidth*this.scale_factor,container.clientHeight*this.scale_factor);

        this.background_element = document.createElement('div');
        this.background_element.classList.add('arena');
        this.background_element.style.backgroundColor = this.color.background;
        this.background_element.style.width = `${this.size_screen}px`;
        this.background_element.style.height = `${this.size_screen}px`;
        this.background_element.style.left = `${this.x*this.size_screen/this.radius/2-this.size_screen/2+container.clientWidth/2}px`;
        this.background_element.style.top = `${this.y*this.size_screen/this.radius/2-this.size_screen/2+container.clientHeight/2}px`;
        container.appendChild(this.background_element);        
        
        this.border_element = document.createElement('div');
        this.border_element.classList.add('arenaBorder');
        this.border_element.style.border = "2px solid " + this.color.border;
        this.border_element.style.width = `${this.radius*2}px`;
        this.border_element.style.height = `${this.radius*2}px`;
        this.border_element.style.left = `${0}px`;  // Centré par rapport au cercle extérieur
        this.border_element.style.top = `${0}px`;   // Centré par rapport au cercle extérieur
        this.background_element.appendChild(this.border_element);
    }
}

////////////////////////////////////////////////////////////////////////
//FONCTIONS 
////////////////////////////////////////////////////////////////////////
function vect_unitaire(x,y){
    let r=Math.sqrt(x**2+y**2);
    //console.log("x,y,r",x,y,r)
    return [x/r,y/r];
};

function updatePositions(){
    let is_collision = false;
    for (let i = 0;i<tab_player.length;i++){
        if (tab_player[i].nb_life<=0){
            continue;
        }
        if (distance(tab_player[i],arena)>arena.radius+tab_player[i].radius){
            console.log("mort");
        }
        for (let j = i+1;j<tab_player.length;j++){
            if (tab_player[j].nb_life<=0){
                continue;
            }
            if (distance(tab_player[i],tab_player[j])<tab_player[i].radius+tab_player[j].radius){
                is_collision = true;

                let x1x2 = tab_player[j].x-tab_player[i].x;
                let y1y2 = tab_player[j].y-tab_player[i].y;
                //console.log("M1M2",x1x2,y1y2)
                if (x1x2 != 0 && y1y2 != 0){
                    let n = vect_unitaire(x1x2,y1y2)
                    //console.log("n",n)
                    let v = ((tab_player[i].speed_x-tab_player[j].speed_x)*n[0] + (tab_player[i].speed_y-tab_player[j].speed_y)*n[1]);
                    let produitscalaire_dv = Math.sqrt((tab_player[i].speed_x-tab_player[j].speed_x)**2+(tab_player[i].speed_y-tab_player[j].speed_y)**2);
                    let produitscalaire_n = Math.sqrt(n[0]**2+n[1]**2);
                    let angle = Math.acos(v/produitscalaire_n/produitscalaire_dv)*180/Math.PI;
                    console.log("angle :",angle,"x,y:",tab_player[i].x,tab_player[i].y);
                    if (angle <90){
                        v = v/(tab_player[i].mass+tab_player[j].mass);
                        //console.log("v",v)
                        tab_player[i].speed_x -= 2*tab_player[j].mass*v*n[0];
                        tab_player[i].speed_y -= 2*tab_player[j].mass*v*n[1];
                        tab_player[j].speed_x += 2*tab_player[i].mass*v*n[0];
                        tab_player[j].speed_y += 2*tab_player[i].mass*v*n[1];
                    }
                }
                else {
                    tab_player[j].x += tab_player[i].radius+tab_player[j].radius;
                    tab_player[i].speed_x = 0;
                    tab_player[i].speed_y = 0;
                }
            }
        }
        
        let speed = Math.sqrt(tab_player[i].speed_x**2+tab_player[i].speed_y**2);
        let mu = tab_player[i].coeffFriction(speed);
        if (speed != 0){
            //console.log("speed,mu,speedx",speed,mu,tab_player[i].speed_x,mu*tab_player[i].speed_x/speed)
            if (!is_collision){
                tab_player[i].speed_x -= mu*tab_player[i].speed_x/speed/60;
                tab_player[i].speed_y -= mu*tab_player[i].speed_y/speed/60;
            }
            //console.log("playerspeed",tab_player[i].speed_x,tab_player[i].speed_y)
            tab_player[i].x += tab_player[i].speed_x/60;
            tab_player[i].y += tab_player[i].speed_y/60;
            //console.log("playerpos",tab_player[i].x,tab_player[i].y)
        };
        if (tab_player[i].delta_v < 100){
            let coeff_reload = 1;
            if (tab_player[i].delta_v<tab_player[i].exhaustion_level){
                coeff_reload=0.75;
            };
            tab_player[i].delta_v += coeff_reload*100000/tab_player[i].reload_time/60;
            if (tab_player[i].delta_v > 100){
                tab_player[i].delta_v = 100;
            };
        };
        tab_player[i].circle.style.left = `${(tab_player[i].x-tab_player[i].radius)*coeff_size+container.clientWidth/2}px`;
        tab_player[i].circle.style.top = `${(tab_player[i].y-tab_player[i].radius)*coeff_size+container.clientHeight/2}px`;
        tab_player[i].circle.style.width = `${2*tab_player[i].radius*coeff_size}px`;
        tab_player[i].circle.style.height = `${2*tab_player[i].radius*coeff_size}px`;
        tab_player[i].innerCircle.style.width = `${2*tab_player[i].radius*tab_player[i].delta_v/100*coeff_size}px`;
        tab_player[i].innerCircle.style.height = `${2*tab_player[i].radius*tab_player[i].delta_v/100*coeff_size}px`;
        tab_player[i].innerCircle.style.left = `${tab_player[i].radius*(1-tab_player[i].delta_v/100)*coeff_size}px`;  // Centré par rapport au cercle extérieur
        tab_player[i].innerCircle.style.top = `${tab_player[i].radius*(1-tab_player[i].delta_v/100)*coeff_size}px`;   // Centré par rapport au cercle extérieur
        
        if (tab_player[i].delta_v < tab_player[i].exhaustion_level){
            tab_player[i].innerCircle.style.border = "2px solid " + tab_player[i].color.exhaustion; //rgb(160, 11, 11)
        }
        else {
            tab_player[i].innerCircle.style.border = "2px solid "+ tab_player[i].color.border; //rgb(0,0,0)   // Centré par rapport au cercle extérieur
        }
    }

};

function startMovement(){
    if (!is_interval) {
        is_interval = true;
        movement = setInterval(() => {updatePositions();
        },1000/60);
        console.log("START MOVEMENT",movement);
    }
};

function distance(player1,player2){
    return Math.sqrt((player1.x-player2.x)**2+(player1.y-player2.y)**2);
};

function createSocket() {
    socket = new WebSocket('ws://localhost:8080');
    let retries = 0;
    const maxRetries = 5;
    socket.onopen = function() {
        if (is_interval){
            clearInterval(movement);
        }
        socket_open = true;
        console.log('Connexion WebSocket ouverte');
        let type_request = 'give token';
        send(JSON.stringify({type_request,token}));
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        //console.log(data);
        if (data.type_request == 'token serveur'){
            token_serveur = data.token;
            console.log("token serveur :",data.token);
        }
        else if (data.type_request=="new player" && data.nb_life>0){
            let is_exist = false;
            console.log("request new player");
            for (const player of tab_player){
                if (player.token == data.newplayer_token){
                    is_exist = true;
                    console.log("EXIST");
                    break;
                }
            }
            if (!is_exist){
                console.log("new player");
                let tab_token = [];
                console.log("tab_token :",tab_token);
                if (token == data.newplayer_token){
                    console.log("me",data.color);
                    self = new Player(data.x,data.y,true,token,return_color(data.color),100,data.nb_life);
                    tab_player.push(self);
                }
                else {
                    console.log("not me",data.color)
                    let circle = new Player(data.x,data.y,false,data.newplayer_token,return_color(data.color),100,data.nb_life);
                    tab_player.push(circle);
                }
            }
        }
        else if (data.type_request=="update nb player"){
            if (arena != false){
                arena.size_screen = Math.min(container.clientWidth/arena.scale_factor,container.clientHeight/arena.scale_factor);
                arena.change_size();
                coeff_size = arena.size_screen/arena.radius/2;
            }
            if (is_interval){
                clearInterval(movement);
            }
            //console.log("nb player update :",data.nb_player);
        }
        else if (data.type_request == "update"){
            //console.log(is_interval);
            if (is_interval){
                is_interval = false;
                clearInterval(movement);
                console.log("clear",movement);
            }
            //console.log("UPDATE :",arena)
            
            
            for (player of tab_player){
                if (player.token == data.player_token){
                    player.nb_life = data.nb_life;
                    if (player.nb_life>0){
                        player.x = data.x;
                        player.y = data.y;
                        player.speed_x = data.vx;
                        player.speed_y = data.vy;
                        player.delta_v = data.delta_v;
                        player.text.textContent = player.nb_life;
                        player.text.style.fontSize = `${player.radius*2.5/3*coeff_size}px`;
                        player.circle.style.left = `${(player.x-player.radius)*coeff_size+container.clientWidth/2}px`;
                        player.circle.style.top = `${(player.y-player.radius)*coeff_size+container.clientHeight/2}px`;
                        player.circle.style.width = `${2*player.radius*coeff_size}px`;
                        player.circle.style.height = `${2*player.radius*coeff_size}px`;
                        player.innerCircle.style.width = `${2*player.radius*player.delta_v/100*coeff_size}px`;
                        player.innerCircle.style.height = `${2*player.radius*player.delta_v/100*coeff_size}px`;
                        player.innerCircle.style.left = `${player.radius*(1-player.delta_v/100)*coeff_size}px`;  
                        player.innerCircle.style.top = `${player.radius*(1-player.delta_v/100)*coeff_size}px`;   
                        if (player.delta_v < player.exhaustion_level){
                            player.innerCircle.style.border = "2px solid " + player.color.exhaustion; 
                        }
                        else {
                            player.innerCircle.style.border = "2px solid "+ player.color.border; 
                        };
                    }

                }
            }
        }
        else if (data.type_request=="arena" && arena==false){
            console.log("arena :",arena);
            arena = new Arena(color_arena,data.size,0,0,0.9);
            if (arena != false){
                arena.size_screen = Math.min(container.clientWidth/arena.scale_factor,container.clientHeight/arena.scale_factor);
                console.log("arena update :",arena.size_screen);
                arena.change_size();
                coeff_size = arena.size_screen/arena.radius/2;
            }
            console.log(arena);
        }
        else if (data.type_request == "death"){
            for (let i = 0;i<tab_player.length;i++){
                if (tab_player[i].token == data.player_token){
                    tab_player[i].death();
                }
            }
        }
        else{
            console.log("else :",data.type_request);
            //console.log("message reçu :",data);
        }
    };
    socket.onclose = function(event) {
        startMovement()
        socket_open = false;
        console.log("Connexion fermée : tentative de reconnexion dans 1 seconde...");
        if (retries < maxRetries) {
            retries++;
            setTimeout(function() {
                createSocket();
            }, 1000);  // Attends 5 secondes avant de réessayer
        } else {
            console.log("Échec après plusieurs tentatives.");
            // Appeler une fonction pour gérer l'échec complet, ex: afficher un message à l'utilisateur
        }
    };
    //socket.onclose = function(event) {
    //    console.log("close",event)
    //    socket.close();
    //    socket = createSocket();
    //};
    socket.onerror = function(error) {
        console.log("error",error)
    }
}

// Fonction pour générer un token aléatoire (ici un simple exemple basé sur des caractères aléatoires)
function generateToken() {
    const randomToken = Math.random().toString(36).substring(2);
    return randomToken;
}

//crée un token
function getToken(){
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
function send(data){
    if (socket_open){
        socket.send(data);
    }
    else {
        createSocket();
    }
}


function return_color(color){
    if (color == "red"){
        return red;
    }
    if (color == "blue"){
        return blue;
    }
}

////////////////////////////////////////////////////////////////////////
//PROGRAMME PRINCIPAL
////////////////////////////////////////////////////////////////////////
movement = false;
let coeff_size = 1;
let arena = false;
const blue = new Color("#378eff","#7ed0ff","#a00b0b");
const red = new Color("#ea1818","#fc6551","#b40b00");
const color_arena = new Color("#2c2e33","#ffffff","#ffffff");
console.log(container.clientWidth)
is_interval = false; // vaut true si l'intervale créé par startMovement est en cours
socket_open = false;
socket = NaN;
createSocket();
let tab_player = [];
let self = NaN;