import { describe, it, expect } from 'vitest';
import {
  formatInr, formatQuantity, formatMonthLabel, shareOf, formatShare, basisLabel, basisKeys,
  COMPONENT_META, componentLabel, providerLabel,
} from './costFormat';

describe('formatInr', () => {
  it('uses 2 decimals from Rs 1 up', () => {
    expect(formatInr(1234.5)).toBe('₹1,234.50');
    expect(formatInr(1)).toBe('₹1.00');
  });
  it('uses 4 decimals under Rs 1', () => {
    expect(formatInr(0.0123)).toBe('₹0.0123');
  });
  it('floors tiny non-zero values', () => {
    expect(formatInr(0.00001)).toBe('<₹0.0001');
  });
  it('never returns NaN', () => {
    expect(formatInr(0)).toBe('₹0.00');
    expect(formatInr(null)).toBe('₹0.00');
    expect(formatInr(undefined)).toBe('₹0.00');
    expect(formatInr(NaN)).toBe('₹0.00');
    expect(formatInr('abc')).toBe('₹0.00');
  });
});

describe('labels', () => {
  it('names the WhatsApp row exactly', () => {
    expect(COMPONENT_META.whatsapp.label).toBe('WhatsApp (Meta)');
    expect(componentLabel('whatsapp')).toBe('WhatsApp (Meta)');
  });
  it('labels the three bases', () => {
    expect(basisLabel('metered')).toBe('Metered');
    expect(basisLabel('estimated')).toBe('Estimated');
    expect(basisLabel('allocated')).toBe('Allocated');
  });
  it('handles string and object basis', () => {
    expect(basisKeys('allocated')).toEqual(['allocated']);
    expect(basisKeys({ metered: 2, estimated: 0 })).toEqual(['metered']);
    expect(basisKeys(null)).toEqual([]);
  });
  it('labels providers', () => {
    expect(providerLabel(null)).toBe('Agent default');
    expect(providerLabel('sarvam')).toBe('Sarvam');
    expect(providerLabel('google')).toBe('Google');
  });
});

describe('formatQuantity', () => {
  it('formats each component', () => {
    expect(formatQuantity('llm', { tokensIn: 1000, tokensOut: 500 })).toBe('1,500 tokens');
    expect(formatQuantity('tts', { chars: 2500 })).toBe('2,500 characters');
    expect(formatQuantity('telephony', { callSec: 150 })).toBe('2.5 min');
    expect(formatQuantity('stt', { audioSec: 60 })).toBe('1 min');
    expect(formatQuantity('whatsapp', { messages: 7 })).toBe('7 messages');
    expect(formatQuantity('infra', { interactions: 12 })).toBe('12 interactions');
  });
  it('is safe on missing units', () => {
    expect(formatQuantity('tts', undefined)).toBe('0 characters');
  });
});

describe('month and share', () => {
  it('formats month labels', () => {
    expect(formatMonthLabel('2026-11')).toBe('Nov 2026');
    expect(formatMonthLabel('bad')).toBe('bad');
  });
  it('computes share safely', () => {
    expect(shareOf(25, 100)).toBe(25);
    expect(shareOf(5, 0)).toBe(0);
    expect(formatShare(0.2, 100)).toBe('<1%');
    expect(formatShare(50, 100)).toBe('50%');
  });
});
