

export class Player{
    constructor(x=100,y=100,is_player=true,player_token,color,size,nb_life,coeff_size){
        // attributs de position, de vitesse et de taille 
        this.x = x;
        this.y = y;
        this.speed_x = 0; 
        this.speed_y = 0;
        this.radius = size/2;
        this.is_player = is_player;
        this.mass = 10;
        this.nb_life = nb_life;
        
        this.coeff_size = coeff_size;

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
                    let dv = this.dash(e.clientX - (this.x-this.radius)*this.coeff_size()-container.clientWidth/2, e.clientY - (this.y-this.radius)*this.coeff_size()-container.clientHeight/2,Date.now()-this.startTime);
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