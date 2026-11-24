import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/env';

const validEnv = {
  PORT: '3000',
  NODE_ENV: 'development',
  SITE_URL: 'http://localhost:3000',
  SITE_TITLE: 'Notas do Thiago',
  SITE_DESCRIPTION: 'Notas técnicas sobre desenvolvimento de software.',
  DOMAIN: 'localhost',
};

describe('parseEnv', () => {
  it('valida o .env.example e converte PORT para número', () => {
    expect(parseEnv(validEnv)).toEqual({ ...validEnv, PORT: 3000 });
  });

  it('rejeita SITE_TITLE vazio com mensagem clara', () => {
    expect(() => parseEnv({ ...validEnv, SITE_TITLE: '   ' })).toThrowError(/SITE_TITLE/);
    expect(() => parseEnv({ ...validEnv, SITE_TITLE: '   ' })).toThrowError(/não pode ser vazio/);
  });

  it('rejeita SITE_TITLE ausente', () => {
    expect(() => parseEnv({ ...validEnv, SITE_TITLE: undefined })).toThrowError(/SITE_TITLE/);
  });

  it('rejeita SITE_URL inválida', () => {
    expect(() => parseEnv({ ...validEnv, SITE_URL: 'nao-e-url' })).toThrowError(/SITE_URL/);
  });
});
