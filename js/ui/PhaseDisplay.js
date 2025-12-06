// js/ui/PhaseDisplay.js

export class PhaseDisplay {
  constructor(element, eventBus) {
    this.element = element;
    this.eventBus = eventBus;

    this.handlePhaseChange = this.handlePhaseChange.bind(this);
    this.eventBus.on('phase:changed', this.handlePhaseChange);
  }

  handlePhaseChange({ label }) {
    if (label) {
      this.show(label);
    } else {
      this.hide();
    }
  }

  show(text) {
    this.element.textContent = text;
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
  }

  dispose() {
    this.eventBus.off('phase:changed', this.handlePhaseChange);
  }
}
