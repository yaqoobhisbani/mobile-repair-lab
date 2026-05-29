import "@testing-library/jest-dom/vitest"

if (typeof globalThis.Element !== "undefined") {
  globalThis.Element.prototype.scrollIntoView = () => {}

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.DOMRect = class DOMRect {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0,
    ) {}
    get top() { return this.y }
    get right() { return this.x + this.width }
    get bottom() { return this.y + this.height }
    get left() { return this.x }
  } as unknown as typeof globalThis.DOMRect
}
