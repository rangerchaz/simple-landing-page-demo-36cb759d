import { validateForm, validateEmail, validateRequired } from '../../frontend/js/contact.js';

describe('Form Validation', () => {
  describe('Email validation', () => {
    test('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail('   ')).toBe(false);
    });
  });

  describe('Required field validation', () => {
    test('should validate required fields', () => {
      expect(validateRequired('John Doe')).toBe(true);
      expect(validateRequired('test')).toBe(true);
    });

    test('should reject empty or whitespace values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe('Complete form validation', () => {
    test('should validate complete valid form', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };
      expect(validateForm(formData)).toEqual({ isValid: true, errors: {} });
    });

    test('should return errors for invalid form', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        subject: '',
        message: ''
      };
      const result = validateForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.subject).toBeDefined();
      expect(result.errors.message).toBeDefined();
    });

    test('should validate field lengths', () => {
      const formData = {
        name: 'a'.repeat(101), // Too long
        email: 'test@example.com',
        subject: 'a'.repeat(201), // Too long
        message: 'a'.repeat(1001) // Too long
      };
      const result = validateForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('100 characters');
      expect(result.errors.subject).toContain('200 characters');
      expect(result.errors.message).toContain('1000 characters');
    });
  });
});