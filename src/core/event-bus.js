// 实现事件总线

class EventBus {
    constructor(){
        this.handlers = {}
    }

    register(name, fn){
        this.handlers[name] = fn
    }

    emit(name, payload){
        const fn = this.handlers[name]
        if(fn) fn(payload)
    }
}


export const eventBus = new EventBus()

export{ EventBus }