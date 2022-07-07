import * as observer from '@playcanvas/observer';

window.assignEvents = (t) => {
    Object.assign(t, new observer.Events());
    t._events = {};
};
window.observer = observer;
window.Events = observer.Events;
window.Observer = observer.Observer;
window.ObserverList = observer.ObserverList;
window.ObserverHistory = observer.ObserverHistory;
