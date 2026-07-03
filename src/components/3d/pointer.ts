/**
 * Shared normalized pointer (-1..1). Written by Scene's window listener —
 * the canvas container is pointer-events-none, so R3F's own state.pointer
 * never receives events and can't be used here.
 */
export const pointer = { x: 0, y: 0 };
