import { ContactForm } from '../../frontend/js/contact.js';

describe('Frontend-Backend Integration', () => {
  let contactForm;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form">
        <input type="text" name="name" required>
        <input type="email" name="email" required>
        <input type="text" name="subject" required>
        <textarea name="message" required></textarea>
        <button type="submit">Send Message</button>
      </form>
      <div id="form-messages"></div>
    `;
    
    contactForm = new ContactForm();
  });

  test('should handle successful form submission', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Thank you for your message!'
      })
    });

    const form = document.getElementById('contact-form');
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const subjectInput = form.querySelector('input[name="subject"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    nameInput.value = 'John Doe';
    emailInput.value = 'john@example.com';
    subjectInput.value = 'Test Subject';
    messageInput.value = 'Test message content';

    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('John Doe')
    }));

    const messages = document.getElementById('form-messages');
    expect(messages.textContent).toContain('Thank you');
  });

  test('should handle API validation errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        errors: [
          { field: 'email', message: 'Invalid email format' }
        ]
      })
    });

    const form = document.getElementById('contact-form');
    form.dispatchEvent(new Event('submit'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const messages = document.getElementById('form-messages');
    expect(messages.textContent).toContain('Invalid email format');
  });

  test('should handle network errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const form = document.getElementById('contact-form');
    form.dispatchEvent(new Event('submit'));

    await new Promise(resolve => setTimeout(resolve, 100));

    const messages = document.getElementById('form-messages');
    expect(messages.textContent).toContain('network error');
  });

  test('should show loading state during submission', async () => {
    let resolvePromise;
    fetch.mockReturnValueOnce(new Promise(resolve => {
      resolvePromise = resolve;
    }));

    const form = document.getElementById('contact-form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    form.dispatchEvent(new Event('submit'));

    expect(submitButton.disabled).toBe(true);
    expect(submitButton.textContent).toContain('Sending');

    resolvePromise({
      ok: true,
      json: async () => ({ success: true, message: 'Success' })
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(submitButton.disabled).toBe(false);
    expect(submitButton.textContent).toBe('Send Message');
  });
});