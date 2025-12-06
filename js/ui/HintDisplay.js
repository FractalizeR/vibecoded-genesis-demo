// js/ui/HintDisplay.js

export class HintDisplay {
  constructor(element) {
    this.element = element;
  }

  show(text) {
    this.element.textContent = text;
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
  }
}
