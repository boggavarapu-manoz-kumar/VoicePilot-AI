import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contactsApi } from '../lib/contactsApi';
import { accountsApi } from '../lib/accountsApi';
import { ApiErrorResponse } from '../lib/api';
import { CreateContactRequest, UpdateContactRequest, CreateAccountRequest, UpdateAccountRequest } from '../types/crm';

describe('CRM Typed API Client Integration Suite', () => {
  const originalFetch = window.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  describe('contactsApi', () => {
    it('listContacts sends GET with correctly serialized query parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [
            {
              id: 1,
              firstName: 'Sarah',
              lastName: 'Connor',
              email: 'sarah@resistance.org',
              status: 'CUSTOMER',
              createdAt: '2026-10-31T00:00:00Z',
              updatedAt: '2026-10-31T00:00:00Z',
            },
          ],
          page: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await contactsApi.listContacts({
        search: 'connor',
        status: 'CUSTOMER',
        accountId: 42,
        withoutAccount: false,
        page: 1,
        size: 10,
        sort: 'lastName',
        direction: 'desc',
      });

      expect(window.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toContain('/contacts?');
      expect(url).toContain('search=connor');
      expect(url).toContain('status=CUSTOMER');
      expect(url).toContain('accountId=42');
      expect(url).toContain('withoutAccount=false');
      expect(url).toContain('page=1');
      expect(url).toContain('size=10');
      expect(url).toContain('sort=lastName');
      expect(url).toContain('direction=desc');
      expect(options.method).toBe('GET');
      expect(result.content[0].firstName).toBe('Sarah');
      expect(result.totalElements).toBe(1);
    });

    it('getContact sends GET to /contacts/:id and unwraps data envelope', async () => {
      const mockContact = {
        id: 7,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'LEAD',
        createdAt: '2026-10-31T00:00:00Z',
        updatedAt: '2026-10-31T00:00:00Z',
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockContact }),
      });

      const contact = await contactsApi.getContact(7);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/contacts\/7$/);
      expect(options.method).toBe('GET');
      expect(contact.id).toBe(7);
      expect(contact.firstName).toBe('John');
    });

    it('createContact serializes payload as JSON with POST method', async () => {
      const payload: CreateContactRequest = {
        firstName: 'Ellen',
        lastName: 'Ripley',
        email: 'ripley@weyland.corp',
        jobTitle: 'Warrant Officer',
        status: 'CUSTOMER',
        accountId: 3,
      };

      const mockCreated = {
        id: 12,
        ...payload,
        createdAt: '2026-10-31T00:00:00Z',
        updatedAt: '2026-10-31T00:00:00Z',
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockCreated }),
      });

      const created = await contactsApi.createContact(payload);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/contacts$/);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(payload);
      expect(created.id).toBe(12);
      expect(created.firstName).toBe('Ellen');
    });

    it('updateContact sends PUT to /contacts/:id with serialized payload', async () => {
      const payload: UpdateContactRequest = {
        firstName: 'Ellen',
        lastName: 'Ripley',
        email: 'ripley.updated@weyland.corp',
        status: 'CHURNED',
        accountId: null,
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 12, ...payload } }),
      });

      const updated = await contactsApi.updateContact(12, payload);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/contacts\/12$/);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual(payload);
      expect(updated.status).toBe('CHURNED');
    });

    it('deleteContact sends DELETE to /contacts/:id and resolves void', async () => {
      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: null, message: 'Contact deleted successfully' }),
      });

      await contactsApi.deleteContact(99);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/contacts\/99$/);
      expect(options.method).toBe('DELETE');
    });

    it('supports request cancellation via AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort();

      window.fetch = vi.fn().mockImplementation((_, opts) => {
        if (opts?.signal?.aborted) {
          const err = new Error('The user aborted a request.');
          err.name = 'AbortError';
          return Promise.reject(err);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      await expect(contactsApi.listContacts({}, controller.signal)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'The user aborted a request.',
      });
    });
  });

  describe('accountsApi', () => {
    it('listAccounts builds query string and sends GET', async () => {
      const mockAccounts = {
        content: [
          {
            id: 10,
            name: 'Wayne Enterprises',
            domain: 'wayne.corp',
            status: 'ACTIVE',
            contactCount: 5,
            createdAt: '2026-10-31T00:00:00Z',
            updatedAt: '2026-10-31T00:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockAccounts }),
      });

      const result = await accountsApi.listAccounts({
        search: 'wayne',
        status: 'ACTIVE',
        page: 0,
        size: 20,
        sort: 'name',
      });

      const [url, options] = (window.fetch as any).mock.calls[0];
      expect(url).toContain('/accounts?');
      expect(url).toContain('search=wayne');
      expect(url).toContain('status=ACTIVE');
      expect(url).toContain('sort=name');
      expect(options.method).toBe('GET');
      expect(result.content[0].name).toBe('Wayne Enterprises');
    });

    it('getAccount sends GET to /accounts/:id', async () => {
      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 5,
            name: 'Stark Industries',
            domain: 'stark.com',
            status: 'ACTIVE',
            contactCount: 12,
          },
        }),
      });

      const account = await accountsApi.getAccount(5);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/accounts\/5$/);
      expect(options.method).toBe('GET');
      expect(account.id).toBe(5);
      expect(account.contactCount).toBe(12);
    });

    it('createAccount sends POST with payload', async () => {
      const payload: CreateAccountRequest = {
        name: 'Cyberdyne Systems',
        domain: 'cyberdyne.ai',
        industry: 'Defense AI',
        status: 'PROSPECT',
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 8, ...payload } }),
      });

      const created = await accountsApi.createAccount(payload);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/accounts$/);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(payload);
      expect(created.id).toBe(8);
    });

    it('updateAccount sends PUT with payload', async () => {
      const payload: UpdateAccountRequest = {
        name: 'Cyberdyne Global',
        domain: 'cyberdyne.ai',
        status: 'ACTIVE',
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 8, ...payload } }),
      });

      const updated = await accountsApi.updateAccount(8, payload);
      const [url, options] = (window.fetch as any).mock.calls[0];

      expect(url).toMatch(/\/accounts\/8$/);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual(payload);
      expect(updated.name).toBe('Cyberdyne Global');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles HTTP 400 validation failures preserving details array', async () => {
      const errorPayload = {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed for one or more fields',
          details: [
            { field: 'email', issue: 'must be a well-formed email address' },
            { field: 'firstName', issue: 'must not be blank' },
          ],
        },
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorPayload,
      });

      try {
        await contactsApi.createContact({ firstName: '', lastName: '', email: 'invalid' });
        expect.unreachable('Should have thrown ApiErrorResponse');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiErrorResponse);
        const apiErr = err as ApiErrorResponse;
        expect(apiErr.status).toBe(400);
        expect(apiErr.code).toBe('VALIDATION_FAILED');
        expect(apiErr.message).toBe('Validation failed for one or more fields');
        expect(apiErr.details).toHaveLength(2);
        expect(apiErr.details?.[0]).toEqual({ field: 'email', issue: 'must be a well-formed email address' });
      }
    });

    it('handles HTTP 404 resource not found error', async () => {
      const errorPayload = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: "Contact with identifier '999' was not found",
        },
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorPayload,
      });

      try {
        await contactsApi.getContact(999);
        expect.unreachable('Should have thrown ApiErrorResponse');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiErrorResponse);
        const apiErr = err as ApiErrorResponse;
        expect(apiErr.status).toBe(404);
        expect(apiErr.code).toBe('NOT_FOUND');
        expect(apiErr.message).toContain('999');
      }
    });

    it('handles HTTP 500 internal server error gracefully without raw stack traces', async () => {
      const errorPayload = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected internal error occurred. Please try again later.',
        },
      };

      window.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => errorPayload,
      });

      try {
        await accountsApi.getAccount(1);
        expect.unreachable('Should have thrown ApiErrorResponse');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiErrorResponse);
        const apiErr = err as ApiErrorResponse;
        expect(apiErr.status).toBe(500);
        expect(apiErr.code).toBe('INTERNAL_SERVER_ERROR');
        expect(apiErr.message).toBe('An unexpected internal error occurred. Please try again later.');
      }
    });

    it('handles network failure (backend unavailable or connection refused)', async () => {
      window.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        await contactsApi.listContacts();
        expect.unreachable('Should have thrown ApiErrorResponse');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiErrorResponse);
        const apiErr = err as ApiErrorResponse;
        expect(apiErr.status).toBe(0);
        expect(apiErr.code).toBe('NETWORK_ERROR');
        expect(apiErr.message).toBe('Failed to fetch');
      }
    });

    it('handles unexpected non-JSON response from server', async () => {
      window.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });

      try {
        await accountsApi.listAccounts();
        expect.unreachable('Should have thrown ApiErrorResponse');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiErrorResponse);
        const apiErr = err as ApiErrorResponse;
        expect(apiErr.status).toBe(502);
        expect(apiErr.code).toBe('HTTP_502');
        expect(apiErr.message).toBe('Bad Gateway');
      }
    });
  });
});
