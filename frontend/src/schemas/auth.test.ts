import { loginSchema, registerSchema } from './auth';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ username: 'alice', password: 'secret' }).success).toBe(true);
  });

  it('rejects empty username', () => {
    expect(loginSchema.safeParse({ username: '', password: 'secret' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ username: 'alice', password: '' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'password1',
    password_confirm: 'password1',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts password of exactly 8 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: '12345678', password_confirm: '12345678' }).success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: '1234567', password_confirm: '1234567' }).success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    expect(registerSchema.safeParse({ ...valid, password_confirm: 'different' }).success).toBe(false);
  });

  it('rejects empty email', () => {
    expect(registerSchema.safeParse({ ...valid, email: '' }).success).toBe(false);
  });

  it('accepts valid email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'alice@example.com' }).success).toBe(true);
  });

  it('rejects malformed email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });
});
