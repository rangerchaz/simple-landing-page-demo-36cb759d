import { LandingPage } from '../../frontend/js/main.js';

describe('Navigation Component', () => {
  let landingPage;
  let mockElement;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <header class="header">
        <nav class="nav">
          <button class="nav-toggle" aria-expanded="false">Toggle</button>
          <div class="nav-menu">
            <a href="#home" class="nav-link">Home</a>
            <a href="#services" class="nav-link">Services</a>
            <a href="#contact" class="nav-link">Contact</a>
          </div>
        </nav>
      </header>
      <section id="home"></section>
      <section id="services"></section>
      <section id="contact"></section>
    `;
    
    landingPage = new LandingPage();
  });

  describe('Mobile menu toggle', () => {
    test('should toggle mobile menu on click', () => {
      const navToggle = document.querySelector('.nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      navToggle.click();
      
      expect(navToggle.getAttribute('aria-expanded')).toBe('true');
      expect(navMenu.classList.contains('nav-menu-open')).toBe(true);
    });

    test('should close mobile menu when clicking outside', () => {
      const navToggle = document.querySelector('.nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      // Open menu first
      navToggle.click();
      expect(navMenu.classList.contains('nav-menu-open')).toBe(true);
      
      // Click outside
      document.body.click();
      expect(navMenu.classList.contains('nav-menu-open')).toBe(false);
    });

    test('should close mobile menu on escape key', () => {
      const navToggle = document.querySelector('.nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      navToggle.click();
      expect(navMenu.classList.contains('nav-menu-open')).toBe(true);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(navMenu.classList.contains('nav-menu-open')).toBe(false);
    });
  });

  describe('Smooth scrolling', () => {
    test('should scroll to target section on nav link click', () => {
      const homeLink = document.querySelector('a[href="#home"]');
      const homeSection = document.getElementById('home');
      
      homeLink.click();
      
      expect(window.scrollTo).toHaveBeenCalled();
    });

    test('should update active nav link', () => {
      const servicesLink = document.querySelector('a[href="#services"]');
      
      servicesLink.click();
      
      expect(servicesLink.classList.contains('nav-link-active')).toBe(true);
    });
  });

  describe('Responsive behavior', () => {
    test('should close mobile menu on window resize', () => {
      const navMenu = document.querySelector('.nav-menu');
      
      // Open menu
      landingPage.toggleMobileMenu();
      expect(navMenu.classList.contains('nav-menu-open')).toBe(true);
      
      // Simulate window resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      expect(navMenu.classList.contains('nav-menu-open')).toBe(false);
    });
  });
});