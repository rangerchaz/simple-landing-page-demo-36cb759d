describe('Contact Form E2E Tests', () => {
  beforeEach(() => {
    cy.visitHomePage();
    cy.navigateToSection('contact');
  });

  it('should display the contact form correctly', () => {
    cy.get('#contact-form').should('be.visible');
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="subject"]').should('be.visible');
    cy.get('textarea[name="message"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Send Message');
  });

  it('should validate form fields before submission', () => {
    cy.get('button[type="submit"]').click();
    
    // Check for validation messages
    cy.get('input[name="name"]:invalid').should('exist');
    cy.get('input[name="email"]:invalid').should('exist');
    cy.get('input[name="subject"]:invalid').should('exist');
    cy.get('textarea[name="message"]:invalid').should('exist');
  });

  it('should submit valid form data successfully', () => {
    // Intercept API call
    cy.intercept('POST', '/api/contact', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      }
    }).as('submitForm');

    cy.fillContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Inquiry',
      message: 'This is a test message from the contact form.'
    });

    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm');
    cy.waitForFormSubmission();
    
    cy.get('#form-messages').should('contain', 'Thank you for your message');
    cy.get('#form-messages').should('have.class', 'message-success');
  });

  it('should handle form validation errors from API', () => {
    cy.intercept('POST', '/api/contact', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Please provide a valid email address' },
          { field: 'message', message: 'Message must be at least 10 characters' }
        ]
      }
    }).as('submitFormError');

    cy.fillContactForm({
      name: 'John Doe',
      email: 'invalid-email',
      subject: 'Test',
      message: 'Short'
    });

    cy.get('button[type="submit"]').click();

    cy.wait('@submitFormError');
    cy.waitForFormSubmission();
    
    cy.get('#form-messages').should('contain', 'valid email address');
    cy.get('#form-messages').should('contain', 'at least 10 characters');
    cy.get('#form-messages').should('have.class', 'message-error');
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('POST', '/api/contact', { forceNetworkError: true }).as('networkError');

    cy.fillContactForm();
    cy.get('button[type="submit"]').click();

    cy.wait('@networkError');
    cy.waitForFormSubmission();
    
    cy.get('#form-messages').should('contain', 'network error');
    cy.get('#form-messages').should('have.class', 'message-error');
  });

  it('should show loading state during submission', () => {
    cy.intercept('POST', '/api/contact', (req) => {
      