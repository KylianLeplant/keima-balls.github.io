console.log("burfbiejnief");
import {vect_unitaire,distance,generateToken,getToken} from "./modules/fonctions.js";
import {Player} from "./modules/Player.js";
import {Color} from "./modules/Color.js";
import {Arena} from "./modules/Arena.js";
//fç_hji

////////////////////////////////////////////////////////////////////////
//CONSTANTES
////////////////////////////////////////////////////////////////////////


const token = getToken();
const container = document.getElementById('container');
document.body.style.background = "#222222";
let token_serveur = NaN;


////////////////////////////////////////////////////////////////////////
//CLASSES
////////////////////////////////////////////////////////////////////////






////////////////////////////////////////////////////////////////////////
//FONCTIONS 
////////////////////////////////////////////////////////////////////////


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


//envoie des données au serveur
function send(data){
    if (socket_open){
        socket.send(data);
    }
    else {
        createSocket();
    }
}



////////////////////////////////////////////////////////////////////////
//PROGRAMME PRINCIPAL
////////////////////////////////////////////////////////////////////////
let movement = false;
const blue = new Color("#378eff","#7ed0ff","#a00b0b");
const red = new Color("#ea1818","#fc6551","#b40b00");
const color_arena = new Color("#2c2e33","#ffffff","#ffffff");
let coeff_size = 1;
let arena = false;
console.log(container.clientWidth)
let is_interval = false; // vaut true si l'intervale créé par startMovement est en cours
let socket_open = false;
let socket = NaN;
createSocket();
let tab_player = [];
let self = NaN;