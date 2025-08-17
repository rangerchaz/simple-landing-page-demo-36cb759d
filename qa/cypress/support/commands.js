// Custom Cypress commands for the landing page

Cypress.Commands.add('visitHomePage', () => {
  cy.visit('/');
  cy.get('body').should('be.visible');
});

Cypress.Commands.add('navigateToSection', (sectionId) => {
  cy.get(`a[href="#${sectionId}"]`).click();
  cy.get(`#${sectionId}`).should('be.visible');
  cy.url().should('include', `#${sectionId}`);
});

Cypress.Commands.add('toggleMobileMenu', () => {
  cy.get('.nav-toggle').click();
  cy.get('.nav-menu').should('have.class', 'nav-menu-open');
});

Cypress.Commands.add('submitContactForm', (data) => {
  cy.fillContactForm(data);
  cy.get('form#contact-form button[type="submit"]').click();
});

Cypress.Commands.add('waitForFormSubmission', () => {
  cy.get('#form-messages', { timeout: 10000 }).should('not.be.empty');
});

Cypress.Commands.add('checkResponsive', (viewports = ['iphone-6', 'ipad-2', 'macbook-15']) => {
  viewports.forEach(viewport => {
    cy.viewport(viewport);
    cy.get('body').should('be.visible');
    cy.get('.header').should('be.visible');
  });
});