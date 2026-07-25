import { registerBasic } from "./basic.js";
import { registerLayout } from "./layout.js";
import { registerForm } from "./form.js";

export function registerAll(renderer, eventBus){
    //注册h1-h6,p,hr,img
    registerBasic(renderer)
    //注册card,row,col,form
    registerLayout(renderer)
    //注册btn
    registerForm(renderer, eventBus)
}