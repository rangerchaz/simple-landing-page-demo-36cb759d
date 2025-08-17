/**
 * Main JavaScript functionality for TechForward Solutions Landing Page
 * Handles navigation, smooth scrolling, mobile menu, and general interactions
 */

class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContactForm();
        this.initializeComponents();
        this.handlePageLoad();
    }

    setupEventListeners() {
        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.hideLoadingOverlay();
        });

        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link, .hero-actions a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.smoothScrollToSection(targetId);
                this.closeMobileMenu();
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navMenu = document.querySelector('.nav-menu');
            const navToggle = document.querySelector('.nav-toggle');
            
            if (navMenu && navToggle && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Scroll event for header styling
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 100));

        // Resize event for responsive adjustments
        window.addEventListener('resize', this.throttle(() => {
            this.handleResize();
        }, 250));

        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.hideMessage();
            }
        });
    }

    toggleMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const body = document.body;
        
        if (!navToggle || !navMenu) return;

        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        navToggle.setAttribute('aria-expanded', newState.toString());
        navMenu.classList.toggle('nav-menu-open', newState);
        body.classList.toggle('nav-open', newState);
        
        // Focus management
        if (newState) {
            navMenu.querySelector('.nav-link')?.focus();
        }
    }

    closeMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const body = document.body;
        
        if (!navToggle || !navMenu) return;

        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('nav-menu-open');
        body.classList.remove('nav-open');
    }

    smoothScrollToSection(targetId) {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Update URL without triggering page reload
        if (history.replaceState) {
            history.replaceState(null, null, `#${targetId}`);
        }

        // Update active navigation state
        this.updateActiveNavLink(targetId);
    }

    updateActiveNavLink(activeId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeId}`) {
                link.classList.add('nav-link-active');
            } else {
                link.classList.remove('nav-link-active');
            }
        });
    }

    handleScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        const scrollY = window.scrollY;
        const headerHeight = header.offsetHeight;

        // Add/remove scrolled class for header styling
        if (scrollY > headerHeight / 2) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }

        // Update active section based on scroll position
        this.updateActiveSection();
    }

    updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const scrollPosition = window.scrollY + headerHeight + 100;

        let activeSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                activeSection = section.id;
            }
        });

        if (activeSection) {
            this.updateActiveNavLink(activeSection);
        }
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 768) {
            this.closeMobileMenu();
        }

        // Recalculate any size-dependent elements
        this.adjustViewportHeight();
    }

    adjustViewportHeight() {
        // Fix for mobile viewport height issues
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    loadContactForm()