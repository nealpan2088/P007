                          size="small" 
                          color={getStatusColor(order.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {order.storeName} | {formatCurrency(order.totalAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleViewOrder(order.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {recentOrders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  暂无订单
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 快速操作 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              数据分析
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BarChartIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.TENANTS.DASHBOARD}/${tenantId}/analytics`)}
                  sx={{ height: 100, flexDirection: 'column' }}
                >
                  <Typography variant="h6">销售报表</Typography>
                  <Typography variant="caption" color="text.secondary">
                    查看详细销售数据
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.TENANTS.DASHBOARD}/${tenantId}/users`)}
                  sx={{ height: 100, flexDirection: 'column' }}
                >
                  <Typography variant="h6">员工管理</Typography>
                  <Typography variant="caption" color="text.secondary">
                    管理店铺员工
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RestaurantIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.TENANTS.DASHBOARD}/${tenantId}/menu`)}
                  sx={{ height: 100, flexDirection: 'column' }}
                >
                  <Typography variant="h6">菜单管理</Typography>
                  <Typography variant="caption" color="text.secondary">
                    管理菜品和价格
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate(`${TENANT_ROUTES.TENANTS.DASHBOARD}/${tenantId}/settings`)}
                  sx={{ height: 100, flexDirection: 'column' }}
                >
                  <Typography variant="h6">系统设置</Typography>
                  <Typography variant="caption" color="text.secondary">
                    配置店铺参数
                  </Typography>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 系统状态 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              系统状态
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                套餐信息
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={tenant.plan} 
                  color="primary" 
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  试用到期: {new Date(tenant.trialEndsAt).toLocaleDateString('zh-CN')}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={70} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                试用期剩余 70%
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                最近活动
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                      <Typography variant="caption">1</Typography>
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="新店铺创建" 
                    secondary="凤凰餐厅新店已创建" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    2小时前
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                      <Typography variant="caption">2</Typography>
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="大额订单" 
                    secondary="订单 ORD-2026-00123 金额 ¥256.00" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    3小时前
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'warning.main' }}>
                      <Typography variant="caption">3</Typography>
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="系统更新" 
                    secondary="菜单管理系统已更新" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    1天前
                  </Typography>
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 底部提示 */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ mr: 2 }} />
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              欢迎使用麒麟点餐系统！
            </Typography>
            <Typography variant="body2">
              您当前使用的是 {tenant.plan} 套餐。如需更多功能，请升级套餐或联系客服。
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// 添加缺失的图标
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

export default TenantDashboard;