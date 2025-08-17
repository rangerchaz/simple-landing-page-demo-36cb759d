describe('Landing Page E2E Tests', () => {
  beforeEach(() => {
    cy.visitHomePage();
  });

  it('should load the homepage successfully', () => {
    cy.title().should('contain', 'TechForward Solutions');
    cy.get('.hero').should('be.visible');
    cy.get('.hero-title').should('contain', 'Transform Your Business');
  });

  it('should navigate between sections smoothly', () => {
    cy.navigateToSection('services');
    cy.get('#services').should('be.visible');
    
    cy.navigateToSection('about');
    cy.get('#about').should('be.visible');
    
    cy.navigateToSection('contact');
    cy.get('#contact').should('be.visible');
  });

  it('should handle mobile navigation correctly', () => {
    cy.viewport('iphone-6');
    
    cy.get('.nav-toggle').should('be.visible');
    cy.get('.nav-menu').should('not.have.class', 'nav-menu-open');
    
    cy.toggleMobileMenu();
    cy.get('.nav-menu').should('have.class', 'nav-menu-open');
    
    // Navigate to a section
    cy.get('.nav-link[href="#services"]').click();
    cy.get('.nav-menu').should('not.have.class', 'nav-menu-open');
    cy.get('#services').should('be.visible');
  });

  it('should display all required sections', () => {
    const sections = ['home', 'services', 'about', 'contact'];
    
    sections.forEach(section => {
      cy.get(`#${section}`).should('exist').and('be.visible');
    });
  });

  it('should show service cards with proper content', () => {
    cy.get('#services .service-card').should('have.length.at.least', 3);
    
    cy.get('.service-card').each($card => {
      cy.wrap($card).within(() => {
        cy.get('.service-icon').should('be.visible');
        cy.get('.service-title').should('not.be.empty');
        cy.get('.service-description').should('not.be.empty');
      });
    });
  });

  it('should display contact information', () => {
    cy.navigateToSection('contact');
    
    cy.get('.contact-info').should('be.visible');
    cy.get('.contact-method').should('have.length.at.least', 2);
    
    cy.get('.contact-method').each($method => {
      cy.wrap($method).within(() => {
        cy.get('.contact-method-icon').should('be.visible');
        cy.get('.contact-method-label').should('not.be.empty');
        cy.get('.contact-method-value').should('not.be.empty');
      });
    });
  });

  it('should be responsive on different screen sizes', () => {
    cy.checkResponsive(['iphone-6', 'ipad-2', 'macbook-15']);
    
    // Test specific responsive behaviors
    cy.viewport('iphone-6');
    cy.get('.hero-content').should('be.visible');
    cy.get('.services-grid').should('be.visible');
    
    cy.viewport('macbook-15');
    cy.get('.hero-content').should('be.visible');
    cy.get('.services-grid').should('be.visible');
  });

  it('should have proper SEO elements', () => {
    cy.get('head title').should('exist');
    cy.get('head meta[name="description"]').should('exist');
    cy.get('head meta[name="keywords"]').should('exist');
    cy.get('head meta[name="viewport"]').should('exist');
  });
});