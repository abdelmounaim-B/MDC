import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class SelectionComponent extends LightningElement {
  @api selectedOption = '';
  @track selected = '';

  originalOptions = [
    { name: 'Update Connection Information', icon: 'person' },
    { name: 'Launch Authentication Flow', icon: 'lock' }
  ];

  get options() {
    return this.originalOptions.map(option => ({
      ...option,
      className: `grid-item${this.selected === option.name ? ' selected' : ''}`
    }));
  }

  handleOptionSelect(event) {
    const name = event.currentTarget.dataset.name;
    this.selected = name;
    this.selectedOption = name;

    this.dispatchEvent(
      new FlowAttributeChangeEvent('selectedOption', this.selectedOption)
    );
  }

  renderedCallback() {
    if (!this.materialIconsLoaded) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      this.materialIconsLoaded = true;
    }

    // Inject CSS dynamically
    this.injectCSS();
  }

  /**
   * Injects the CSS dynamically to ensure it is applied.
   */
  injectCSS() {
    const style = document.createElement('style');
    style.innerText = `
      .grid-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
      }

      .grid-item {
        width: 130px;
        text-align: center;
        padding: 1rem;
        border: 2px solid #ccc;
        border-radius: 8px;
        cursor: pointer;
        transition: 0.2s;
      }

      .grid-item.selected {
        border-color: #0176d3;
        background-color: #e6f4ff;
      }

      .material-icons {
        font-size: 36px;
        color: #2e2e2e;
      }

      .label {
        margin-top: 0.5rem;
        font-weight: bold;
        font-size: 0.85rem;
      }
    `;

    // Apply the CSS to the template root
    this.template.querySelector('.grid-container').appendChild(style);
  }
}