//import {Color,blue,red,arena_color} from "Color.js";

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
