// MUI组件适配器
// 用于解决MUI v9类型兼容性问题

import React from 'react';
import {
  Grid as MuiGrid,
  Typography as MuiTypography,
  type GridProps,
  type TypographyProps,
} from '@mui/material';

/**
 * 适配的Grid组件
 * 解决MUI v9中Grid组件类型错误问题
 */
export const Grid: React.FC<GridProps & { item?: boolean; container?: boolean }> = (props) => {
  const { item, container, ...rest } = props;
  return <MuiGrid {...rest} />;
};

/**
 * 适配的Typography组件
 * 解决MUI v9中Typography组件类型错误问题
 */
export const Typography: React.FC<TypographyProps & { paragraph?: boolean }> = (props) => {
  const { paragraph, ...rest } = props;
  const style = paragraph ? { marginBottom: '1rem' } : {};
  return <MuiTypography {...rest} style={{ ...style, ...rest.style }} />;
};

export default {
  Grid,
  Typography,
};
