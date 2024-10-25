////////////////////////////////////////////////////////////////////////
//CONSTANTES
////////////////////////////////////////////////////////////////////////

//constantes serveur
const token = generateToken();
const ws = new require('ws');
const http = require('http');
const wss = new ws.Server({noServer: true});

////////////////////////////////////////////////////////////////////////
//CLASSES
////////////////////////////////////////////////////////////////////////
class Circle{
    constructor(x,y,is_player,radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.is_player = is_player;
    }
}
class Player extends Circle{
    constructor(x,y,is_player,player_token,ws,color,nb_life){
        // attributs de position, de vitesse et de taille 
        super(x,y,is_player,50);
        this.speed_x = 0;
        this.speed_y = 0;
        this.mass = 10;
        this.nb_life = nb_life;
        
        this.token = player_token;
        this.ws = ws

        this.color = color
        this.delta_v = 100;   //mana disponible
        this.coeff_acc = 1500;  //coefficient d'accélération par dash
        this.startTime = 0;
        this.critic_clic_time = 500;

        this.reload_time = 1000;
        this.is_charging = false; // booléen, est ce que le joueur charge son attaque
        this.exhaustion_level = 30;   // est ce que le joueur est en état de fatigue (- de 30 de delta_v)


    };

    startMovement(){
        setInterval(() => {this.updatePosition();
        },1000/60);
    };

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
            coeff_acc /= 4;
        };
        let v = this.normalise(dx,dy);
        //console.log(this.speed_x,this.speed_y)
        this.speed_x += v[0]*coeff_acc;
        this.speed_y += v[1]*coeff_acc;
        //console.log(this.speed_x,this.speed_y,Math.min(dt,this.critic_clic_time),dt,coeff_acc);
    };

    normalise(x,y){
        let r = Math.sqrt(x**2+y**2);
        return [x/r,y/r];
    };

    death(){
        this.tp(0,0);
        this.speed_x = 0;
        this.speed_y = 0;
        this.nb_life -= 1;
        console.log("death :",this.nb_life);
        let type_request = "death";
        if (this.nb_life<=0){
            for (player of tab_player){
                player.ws.send(JSON.stringify({token,type_request,player_token:this.token}));
            }
        }
    }

    tp(x,y){
        this.x = x;
        this.y = y;
    }

};

class Client{
    constructor(client_token,ws){
        this.token = client_token;
        this.ws = ws;
    }
}

////////////////////////////////////////////////////////////////////////
//FONCTIONS
////////////////////////////////////////////////////////////////////////

function vect_unitaire(x,y){
    let r=Math.sqrt(x**2+y**2);
    return [x/r,y/r];
};


function updatePositions(){
    let is_collision = false;
    for (let i = 0;i<tab_player.length;i++){
        if (tab_player[i].nb_life<=0){
            continue;
        }
        if (distance(tab_player[i],arena)>tab_player[i].radius+arena.radius){
            tab_player[i].death();
        }
        for (let j = i+1;j<tab_player.length;j++){
            if (tab_player[j].nb_life<=0){
                continue;
            }
            if (distance(tab_player[i],tab_player[j])<tab_player[i].radius+tab_player[j].radius){
                for (let i=0;i<6;i++){
                    console.log("COLLISION")
                }
                is_collision = true;
                let m1 = tab_player[i].mass;
                let m2 = tab_player[j].mass;
                let x1x2 = tab_player[j].x-tab_player[i].x;
                let y1y2 = tab_player[j].y-tab_player[i].y;
                if (x1x2 != 0 && y1y2 != 0){
                    let n = vect_unitaire(x1x2,y1y2)
                    let v = ((tab_player[i].speed_x-tab_player[j].speed_x)*n[0] + (tab_player[i].speed_y-tab_player[j].speed_y)*n[1]);
                    let produitscalaire_dv = Math.sqrt((tab_player[i].speed_x-tab_player[j].speed_x)**2+(tab_player[i].speed_y-tab_player[j].speed_y)**2);
                    let produitscalaire_n = Math.sqrt(n[0]**2+n[1]**2);
                    let angle = Math.acos(v/produitscalaire_n/produitscalaire_dv)*180/Math.PI;
                    if (angle <90){
                        v = v/(tab_player[i].mass+tab_player[j].mass);
                        tab_player[i].speed_x -= 2*tab_player[j].mass*v*n[0];
                        tab_player[i].speed_y -= 2*tab_player[j].mass*v*n[1];
                        tab_player[j].speed_x += 2*tab_player[i].mass*v*n[0];
                        tab_player[j].speed_y += 2*tab_player[i].mass*v*n[1];
                    }
                }
                else {
                    tab_player[j].x += tab_player[i].radius+tab_player[j].radius
                }
            
            }
        }
        
        let speed = Math.sqrt(tab_player[i].speed_x**2+tab_player[i].speed_y**2);
        let mu = tab_player[i].coeffFriction(speed);
        if (speed != 0){
            if (!is_collision){
                tab_player[i].speed_x -= mu*tab_player[i].speed_x/speed/60;
                tab_player[i].speed_y -= mu*tab_player[i].speed_y/speed/60;
            }
            tab_player[i].x += tab_player[i].speed_x/60;
            tab_player[i].y += tab_player[i].speed_y/60;
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

        
    }


};

function startMovement(){
    setInterval(() => {updatePositions();
    },1000/60);
};

function distance(circle1,circle2){
    //console.log(circle2.x,circle2.x)
    return Math.sqrt((circle1.x-circle2.x)**2+(circle1.y-circle2.y)**2);
};

function sendUpdate(){
    let type_request = "update nb player";
    let nb_alive_player = 0;
    for (player of tab_player){
        player.ws.send(JSON.stringify({token,type_request,nb_player:tab_player.length,nb_update}))
        if (player.nb_life>0){
            nb_alive_player ++;
        }
    }
    type_request = "update";
    let i = 0;
    for (client of tab_player){
        for (player of tab_player){
            if (player.nb_life<=0){
                continue;
            }
            client.ws.send(JSON.stringify({token,type_request,player_token:player.token,nb_update,x:player.x,y:player.y,vx:player.speed_x,vy:player.speed_y,delta_v:player.delta_v,i,nb_life:player.nb_life,nb_alive_player}));
        }
        i+=1;
    }
    nb_update += 1;
}

function onSocketConnect(ws) {
    console.log("connected");
    
    //clients.add(ws);console.log("ws");
    
    let type_request = 'token serveur';
    ws.send(JSON.stringify({type_request,token}));
    setInterval(() => {sendUpdate();
    },1000/60);
    ws.on('message', function(message) {
        const data = JSON.parse(message);
        console.log("new message :",data.type_request);
        if (data.type_request == 'give token'){
            console.log("token client :",data.token);
            let found = false;
            if (tab_player.length>0){
                for (let player of tab_player){
                    if (player.token==data.token){
                        player.ws = ws;
                        found = true;
                        for (const other_player of tab_player){
                            let type_request = "new player";
                            console.log(token,type_request,other_player.x,other_player.y,other_player.token,other_player.color);
                            player.ws.send(JSON.stringify({token,type_request,x:other_player.x,y:other_player.y,newplayer_token:other_player.token,color:other_player.color,nb_life:other_player.nb_life}));
                            type_request = 'arena';
                            player.ws.send(JSON.stringify({type_request,x:arena.x,y:arena.y,size:arena.radius}));
                        }
                    }
                };
            }
            if (!found){
                console.log("not found");
                let x = 0;
                let y = 0;
                let color = "blue";
                for (let i=0;i<tab_color.length;i++){
                    console.log(i,color_used[i],data.token)
                    if (!color_used[i]){
                        color = tab_color[i];
                        color_used[i] = true;
                        if (i == 0){
                            x = -200;
                            y = 0;
                        }
                        else if (i == 1){
                            x = 200;
                            y = 0;
                        }
                        else if (i == 2){
                            x = 0;
                            y = -200;
                        }
                        else if (i == 3){
                            x = 0;
                            y = 200;
                        }
                        break;
                    }
                }
                let new_player = new Player(x,y,true,data.token,ws,color,5);
                tab_player.push(new_player);
                const newplayer_token = data.token;
                console.log(new_player.color)
                for (const player of tab_player){
                    let type_request = "new player";
                    console.log("new player color :",new_player.color);
                    player.ws.send(JSON.stringify({token,type_request,x,y,newplayer_token,color:new_player.color,nb_life:new_player.nb_life}));
                    ws.send(JSON.stringify({token,type_request,x:player.x,y:player.y,newplayer_token:player.token,color:player.color,nb_life:player.nb_life}));
                    type_request = 'arena';
                    ws.send(JSON.stringify({type_request,x:arena.x,y:arena.y,size:arena.radius}));
                    //if (player.token!=data.token){
                    //    ws.send(JSON.stringify(token,type_request,x,y,newplayer_token));
                    //};
                }
            }
            console.log(tab_player.length);
        }
        else if (data.type_request=="dash"){
            console.log("dash :",data.token);
            for (let player of tab_player){
                if (player.nb_life <= 0){
                    continue;
                }
                if (player.token == data.token){
                    player.speed_x += data.dvx;
                    player.speed_y += data.dvy;
                    player.delta_v -= data.used_delta_v;

                }
            }
        }
        //else{
        //    console.log("message recu:",data);
        //}

    });

    ws.on('close', function() {
        //for (let i=0;i<tab_player.length;i++){
        //    if (tab_player[i].ws==ws){
        //        for (let j=0;j<tab_color.length;j++){
        //            if (tab_color[j]==tab_player[i].color){
        //                color_used[j]=false;
        //            }
        //        }
        //    }
        //}
        console.log("Client déconnecté");
        //tab_player = tab_player.filter(player => player.ws !== ws);
    });
};

// Fonction pour générer un token aléatoire (ici un simple exemple basé sur des caractères aléatoires)
function generateToken() {console.log("gentoken");
    const randomToken = Math.random().toString(36).substring(2);
    return randomToken;
};

//PROGRAMME PRINCIPAL
let arena = new Circle(0,0,false,500);
let tab_color = ["blue","red"]  //le joueur i dans tab_player aura la couleur i dans tab_color
let color_used = [false,false];
let nb_update = 0; //nombre de fois que le serveur a envoyé l'update des positions aux clients
http.createServer((req, res) => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
    }).listen(8080, () => {
    console.log('Serveur en écoute sur le port 8080');
});
let tab_player = [];
let tab_client = [];
startMovement()
