import { registerBasic } from "./basic";
import { registerLayout } from "./layout";
import { registerForm } from "./form";

export function registerAll(renderer, eventBus){
    //注册h1-h6,p,hr,img
    registerBasic(renderer)
    //注册card,row,col,form
    registerLayout(renderer)
    //注册btn
    registerForm(renderer, eventBus)
}