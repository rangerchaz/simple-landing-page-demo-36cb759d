// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide XHR requests in command log
Cypress.on('window:before:load', (win) => {
  win.fetch = null;
});

// Custom commands for common actions
Cypress.Commands.add('fillContactForm', (data = {}) => {
  const defaultData = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Test Subject',
    message: 'This is a test message'
  };

  const formData = { ...defaultData, ...data };

  cy.get('input[name="name"]').clear().type(formData.name);
  cy.get('input[name="email"]').clear().type(formData.email);
  cy.get('input[name="subject"]').clear().type(formData.subject);
  cy.get('textarea[name="message"]').clear().type(formData.message);
});

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});