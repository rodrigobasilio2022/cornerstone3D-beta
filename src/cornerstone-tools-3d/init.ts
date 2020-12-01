// @TODO: WebPack alias for import to enforce clean separation
import { renderingEventTarget, EVENTS as RENDERING_EVENTS } from './../index';
import { addEnabledElement, removeEnabledElement } from './store/index';

export default function(defaultConfiguration = {}) {
  _addCornerstoneEventListeners();
}

/**
 * Wires up event listeners for the Cornerstone#ElementDisabled and
 * Cornerstone#ElementEnabled events.
 *
 * @private
 * @method
 * @returns {void}
 */
function _addCornerstoneEventListeners() {
  // Clear any listeners that may already be set
  _removeCornerstoneEventListeners();

  const elementEnabledEvent = RENDERING_EVENTS.ELEMENT_ENABLED;
  const elementDisabledEvent = RENDERING_EVENTS.ELEMENT_DISABLED;

  renderingEventTarget.addEventListener(elementEnabledEvent, addEnabledElement);
  renderingEventTarget.addEventListener(
    elementDisabledEvent,
    removeEnabledElement
  );
}

/**
 * Removes event listeners for the Cornerstone#ElementDisabled and
 * Cornerstone#ElementEnabled events.
 *
 * @private
 * @method
 * @returns {void}
 */
function _removeCornerstoneEventListeners() {
  const elementEnabledEvent = RENDERING_EVENTS.ELEMENT_ENABLED;
  const elementDisabledEvent = RENDERING_EVENTS.ELEMENT_DISABLED;

  renderingEventTarget.removeEventListener(
    elementEnabledEvent,
    addEnabledElement
  );
  renderingEventTarget.removeEventListener(
    elementDisabledEvent,
    removeEnabledElement
  );
}
