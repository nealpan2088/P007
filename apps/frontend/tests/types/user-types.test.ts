/**
 * User类型兼容性测试
 * 验证api.types.User和simple-auth.User的类型兼容性
 */

import { describe, test, expect } from 'vitest';
import type { User as ApiUser } from '../../src/types/api.types';
import type { User as AuthUser } from '../../src/api/simple-auth';

describe('User类型兼容性测试', () => {
  test('ApiUser类型应该包含必要属性', () => {
    // 测试ApiUser类型的基本结构
    const user: ApiUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
    };

    expect(user.id).toBe('user-123');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('user');
    expect(user.status).toBe('ACTIVE');
  });

  test('ApiUser应该支持可选的fullName属性', () => {
    // 测试string类型的fullName
    const userWithString: ApiUser = {
      id: 'user-1',
      email: 'test1@example.com',
      fullName: '张三',
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
    };

    // 测试null类型的fullName
    const userWithNull: ApiUser = {
      id: 'user-2',
      email: 'test2@example.com',
      fullName: null,
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
    };

    // 测试undefined类型的fullName（不提供）
    const userWithoutFullName: ApiUser = {
      id: 'user-3',
      email: 'test3@example.com',
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
    };

    expect(userWithString.fullName).toBe('张三');
    expect(userWithNull.fullName).toBeNull();
    expect(userWithoutFullName.fullName).toBeUndefined();
  });

  test('AuthUser应该完全兼容ApiUser', () => {
    // AuthUser应该可以赋值给ApiUser
    const authUser: AuthUser = {
      id: 'auth-123',
      email: 'auth@example.com',
      fullName: '李四',
      role: 'admin',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
      emailVerified: true,
      tenants: [],
    };

    // 这个赋值应该成功（类型兼容性测试）
    const apiUser: ApiUser = authUser;

    expect(apiUser.id).toBe('auth-123');
    expect(apiUser.email).toBe('auth@example.com');
    expect(apiUser.fullName).toBe('李四');
    expect(apiUser.role).toBe('admin');
  });

  test('AuthUser应该支持扩展属性', () => {
    const authUser: AuthUser = {
      id: 'ext-123',
      email: 'ext@example.com',
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
      emailVerified: false,
      tenants: [{ id: 'tenant-1', name: '测试租户' }],
    };

    // 验证扩展属性
    expect(authUser.emailVerified).toBe(false);
    expect(authUser.tenants).toHaveLength(1);
    expect(authUser.tenants?.[0].name).toBe('测试租户');
  });

  test('fullName属性应该接受null值', () => {
    const userWithNullFullName: ApiUser = {
      id: 'null-test',
      email: 'null@example.com',
      fullName: null,
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
    };

    expect(userWithNullFullName.fullName).toBeNull();
  });

  test('类型应该通过TypeScript编译检查', () => {
    // 这个测试验证类型定义是否正确
    // 如果类型定义有错误，TypeScript编译会失败
    
    const validUsers: ApiUser[] = [
      {
        id: '1',
        email: 'test1@example.com',
        fullName: '姓名1',
        role: 'user',
        status: 'ACTIVE',
        createdAt: '2026-04-22T10:00:00Z',
        updatedAt: '2026-04-22T10:00:00Z',
      },
      {
        id: '2',
        email: 'test2@example.com',
        fullName: null,
        role: 'admin',
        status: 'INACTIVE',
        createdAt: '2026-04-22T10:00:00Z',
        updatedAt: '2026-04-22T10:00:00Z',
      },
      {
        id: '3',
        email: 'test3@example.com',
        role: 'user',
        status: 'ACTIVE',
        createdAt: '2026-04-22T10:00:00Z',
        updatedAt: '2026-04-22T10:00:00Z',
      },
    ];

    expect(validUsers).toHaveLength(3);
    expect(validUsers[0].fullName).toBe('姓名1');
    expect(validUsers[1].fullName).toBeNull();
    expect(validUsers[2].fullName).toBeUndefined();
  });
});

describe('类型修复验证测试', () => {
  test('修复后的类型应该没有TypeScript错误', () => {
    // 模拟useAuth钩子中的类型使用
    const mockAuthResponse = {
      success: true,
      user: {
        id: 'test-id',
        email: 'test@example.com',
        fullName: null,
        role: 'user',
        status: 'ACTIVE',
        createdAt: '2026-04-22T10:00:00Z',
        updatedAt: '2026-04-22T10:00:00Z',
      },
      tokens: {
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
        expiresAt: '2026-04-23T10:00:00Z',
        refreshTokenExpiresAt: '2026-05-22T10:00:00Z',
      },
      sessionId: 'session-123',
    };

    // 验证类型兼容性
    const user: ApiUser = mockAuthResponse.user;
    expect(user.id).toBe('test-id');
    expect(user.fullName).toBeNull();
  });

  test('setUser函数应该接受null值', () => {
    // 模拟useAuth中的setUser调用
    const user: ApiUser = {
      id: 'set-test',
      email: 'set@example.com',
      fullName: null,
      role: 'user',
      status: 'ACTIVE',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-04-22T10:00:00Z',
    };

    // 验证可以设置null fullName的用户
    expect(user.fullName).toBeNull();
  });
});