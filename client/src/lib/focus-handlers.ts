/**
 * Utility functions for handling focus events consistently across the application
 * These functions implement automatic text selection for better user experience
 */

/**
 * Handles focus for standard input elements by selecting all text
 * @param e The focus event
 */
export const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};

/**
 * Handles focus for textarea elements by selecting all text
 * @param e The focus event
 */
export const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
  e.target.select();
};

/**
 * Specialized handler for number inputs that only selects text when the value is zero
 * This provides a better experience for numeric fields
 * @param e The focus event
 */
export const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  if (parseFloat(e.target.value) === 0) {
    e.target.select();
  }
};

/**
 * Apply consistent focus behavior to date inputs and other special elements
 * that can't be directly handled via JSX props
 */
export const updateAllFocusHandlers = () => {
  // Apply to date inputs
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    if (input instanceof HTMLInputElement) {
      input.addEventListener('focus', (e) => {
        const target = e.target as HTMLInputElement;
        target.select();
      });
    }
  });
  
  // Apply to any other special input types that need consistent handling
  const specialInputs = document.querySelectorAll('.auto-select');
  specialInputs.forEach(input => {
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.addEventListener('focus', (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        target.select();
      });
    }
  });
};