// js/ui/FadeOverlay.js

export class FadeOverlay {
  constructor(element) {
    this.element = element;
  }

  setOpacity(value) {
    this.element.style.opacity = value;
  }
}
