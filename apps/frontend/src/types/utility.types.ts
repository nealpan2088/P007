// 麒麟项目 - 工具类型定义

/**
 * 可选属性类型
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必需属性类型
 */
export type MakeRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 只读属性类型
 */
export type MakeReadonly<T, K extends keyof T> = T & { readonly [P in K]: T[P] };

/**
 * 排除null和undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 深度只读
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * 深度可选
 */
export type DeepPartial<T> = T extends (infer R)[]
  ? DeepPartialArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepPartialObject<T>
  : T | undefined;

interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}
type DeepPartialObject<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * 深度必需
 */
export type DeepRequired<T> = T extends (infer R)[]
  ? DeepRequiredArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepRequiredObject<T>
  : NonNullable<T>;

interface DeepRequiredArray<T> extends Array<DeepRequired<T>> {}
type DeepRequiredObject<T> = {
  [P in keyof T]-?: DeepRequired<T[P]>;
};

/**
 * 提取数组元素类型
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * 提取Promise返回值类型
 */
export type PromiseType<T extends Promise<any>> = 
  T extends Promise<infer U> ? U : never;

/**
 * 提取函数返回值类型
 */
export type ReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => infer R ? R : any;

/**
 * 提取函数参数类型
 */
export type Parameters<T extends (...args: any) => any> = 
  T extends (...args: infer P) => any ? P : never;

/**
 * 键值对类型
 */
export type KeyValuePair<K extends string | number | symbol, V> = {
  [key in K]: V;
};

/**
 * 记录类型（简化版）
 */
export type Record<K extends string | number | symbol, T> = {
  [P in K]: T;
};

/**
 * 枚举值类型
 */
export type EnumValues<T extends Record<string, string | number>> = T[keyof T];

/**
 * 路由参数类型
 */
export type RouteParams<T extends string> = 
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

/**
 * 表单错误类型
 */
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * 表单触摸状态
 */
export type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

/**
 * 加载状态
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 异步操作状态
 */
export interface AsyncState<T = any, E = any> {
  data?: T;
  error?: E;
  status: LoadingState;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * 过滤参数
 */
export interface FilterParams {
  [key: string]: any;
}

/**
 * 查询参数
 */
export interface QueryParams extends PaginationParams, FilterParams {}

// 工具类型导出
// 注意：类型不能作为值导出，这里只做类型导出
// 使用 import type { Optional } from '../types/utility.types' 导入类型