import { sendEmail, getEmails, markRead } from '../../src/tools/email';

describe('E2E: Email tools (mock)', () => {
  it('queues, lists, and marks read', () => {
    const id = sendEmail('user@example.com', 'Hello', 'Body');
    expect(id.startsWith('queued:')).toBe(true);
    const emails = getEmails('user@example.com');
    expect(emails.length).toBeGreaterThan(0);
    const bareId = id.replace('queued:', '');
    const res = markRead(bareId);
    expect(res).toBe('ok');
  });
});

