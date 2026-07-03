type Listener = () => void;

let booted = false;
const listeners: Listener[] = [];

/** Fired by the loading screen the moment the reveal starts. */
export function markBooted() {
  if (booted) return;
  booted = true;
  for (const cb of listeners.splice(0)) cb();
}

/** Subscribe to boot completion; fires immediately if already booted. */
export function onBooted(cb: Listener) {
  if (booted) {
    cb();
    return () => {};
  }
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i !== -1) listeners.splice(i, 1);
  };
}
