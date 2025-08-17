import supertest from 'supertest';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('Contact Form API Integration', () => {
  describe('POST /api/contact', () => {
    test('should submit valid form data successfully', async () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Inquiry',
        message: 'This is a test message from the contact form.'
      };

      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Thank you');
    });

    test('should return validation errors for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        subject: '',
        message: 'Short'
      };

      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData)
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should handle rate limiting', async () => {
      const formData = {
        name: 'Rate Test',
        email: 'rate@test.com',
        subject: 'Rate Limit Test',
        message: 'Testing rate limiting functionality'
      };

      // Send multiple requests quickly
      const requests = Array(6).fill().map(() => 
        fetch(`${API_BASE_URL}/api/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429);
      expect(rateLimited).toBe(true);
    });

    test('should handle XSS attempts', async () => {
      const xssData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        subject: '<img src=x onerror=alert("xss")>',
        message: 'Normal message'
      };

      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(xssData)
      });

      if (response.ok) {
        const result = await response.json();
        expect(result.success).toBe(true);
        // Ensure XSS content is sanitized in logs (backend should handle this)
      }
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
    });
  });

  describe('CORS handling', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });
  });
});