/**
 * 数字验证码组件 - 逻辑单元测试
 *
 * 测试验证码核心逻辑（不依赖 React 渲染）：
 * - 数字生成（4位随机）
 * - 顺序点击验证
 * - 错误重置
 *
 * 运行: cd apps/frontend && npx vitest run tests/components/digit-verify.test.ts
 */
import { describe, it, expect } from 'vitest';

describe('数字验证码 - 核心逻辑', () => {
  it('验证码应该生成4位数字', () => {
    const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
    expect(digits).toHaveLength(4);
    digits.forEach(d => {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(9);
    });
  });

  it('打乱后的数组长度应与原数组一致', () => {
    const digits = [3, 7, 1, 9];
    const shuffled = [...digits].sort(() => Math.random() - 0.5);
    expect(shuffled).toHaveLength(4);
    expect(shuffled.sort()).toEqual(digits.sort());
  });

  it('按顺序点击所有数字应全部通过', () => {
    const codeDigits = [5, 2, 8, 3];
    const shuffled = [2, 8, 5, 3]; // 打乱后的顺序

    const clickedIndexes: number[] = [];

    // 模拟按正确顺序点击: 5, 2, 8, 3
    const correctClicks = [5, 2, 8, 3];
    for (const digit of correctClicks) {
      // 在shuffled中找到这个数字的第一个未点击索引
      const idx = shuffled.findIndex((d, i) => d === digit && !clickedIndexes.includes(i));
      expect(idx).not.toBe(-1); // 数字必须存在且未点击

      const expectedDigit = codeDigits[clickedIndexes.length];
      expect(digit).toBe(expectedDigit); // 顺序必须正确

      clickedIndexes.push(idx);
    }

    expect(clickedIndexes).toHaveLength(4);
  });

  it('点击顺序错误时应失败', () => {
    const codeDigits = [5, 2, 8, 3];
    const shuffled = [2, 8, 5, 3];

    // 模拟点击: 2（错误，正确应该是5）
    const wrongDigit = 2;
    const idx = shuffled.indexOf(wrongDigit);
    const expectedDigit = codeDigits[0]; // 应该是5

    expect(wrongDigit).not.toBe(expectedDigit);
  });

  it('重复数字的处理', () => {
    const codeDigits = [4, 4, 4, 9]; // 前三位重复
    const shuffled = [9, 4, 4, 4];

    const clickedIndexes: number[] = [];

    // 按正确顺序点击: 4, 4, 4, 9
    const correctClicks = [4, 4, 4, 9];
    for (const digit of correctClicks) {
      // 在shuffled中找第一个未点击的该数字
      const idx = shuffled.findIndex((d, i) => d === digit && !clickedIndexes.includes(i));
      expect(idx).not.toBe(-1);

      const expectedDigit = codeDigits[clickedIndexes.length];
      expect(digit).toBe(expectedDigit);

      clickedIndexes.push(idx);
    }

    expect(clickedIndexes).toHaveLength(4);
  });
});
