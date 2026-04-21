                <TextField
                  fullWidth
                  label="联系邮箱 *"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  error={!!validationErrors.contactEmail}
                  helperText={validationErrors.contactEmail}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="联系电话"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="联系人"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="行业"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="地址"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="员工数量"
                  name="employeeCount"
                  value={formData.employeeCount}
                  onChange={handleInputChange}
                  type="number"
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="成立年份"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  type="number"
                  disabled={saving}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveBasicInfo}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存基本信息'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(TENANT_ROUTES.TENANTS.LIST)}
                disabled={saving}
              >
                取消
              </Button>
            </Box>
          </TabPanel>

          {/* 系统设置标签页 */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>界面语言</InputLabel>
                  <Select
                    name="language"
                    value={settingsData.language}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, language: e.target.value }))}
                    label="界面语言"
                    disabled={saving}
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>货币</InputLabel>
                  <Select
                    name="currency"
                    value={settingsData.currency}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, currency: e.target.value }))}
                    label="货币"
                    disabled={saving}
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>时区</InputLabel>
                  <Select
                    name="timezone"
                    value={settingsData.timezone}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, timezone: e.target.value }))}
                    label="时区"
                    disabled={saving}
                  >
                    {timezones.map((tz) => (
                      <MenuItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>主题</InputLabel>
                  <Select
                    name="theme"
                    value={settingsData.theme}
                    onChange={(e) => setSettingsData(prev => ({ ...prev, theme: e.target.value }))}
                    label="主题"
                    disabled={saving}
                  >
                    <MenuItem value="light">浅色主题</MenuItem>
                    <MenuItem value="dark">深色主题</MenuItem>
                    <MenuItem value="auto">跟随系统</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存系统设置'}
              </Button>
            </Box>
          </TabPanel>

          {/* 套餐管理标签页 */}
          <TabPanel value={tabValue} index={2}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                当前套餐
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={plans.find(p => p.value === formData.plan)?.label || formData.plan}
                  color={plans.find(p => p.value === formData.plan)?.color as any}
                  size="medium"
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  试用到期: {new Date(tenant.trialEndsAt).toLocaleDateString('zh-CN')}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                可用套餐
              </Typography>
              <Grid container spacing={2}>
                {plans.map((plan) => (
                  <Grid item xs={12} md={6} key={plan.value}>
                    <Paper 
                      variant={formData.plan === plan.value ? "outlined" : "elevation"} 
                      elevation={formData.plan === plan.value ? 0 : 1}
                      sx={{ 
                        p: 2, 
                        border: formData.plan === plan.value ? '2px solid' : '1px solid',
                        borderColor: formData.plan === plan.value ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => handlePlanChange(plan.value)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{plan.label}</Typography>
                        {formData.plan === plan.value && (
                          <Chip label="当前套餐" size="small" color="primary" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {plan.value === 'FREE' && '适合初创餐厅，基础功能'}
                        {plan.value === 'BASIC' && '适合小型餐厅，更多功能'}
                        {plan.value === 'PREMIUM' && '适合中型餐厅，完整功能'}
                        {plan.value === 'ENTERPRISE' && '适合连锁餐厅，定制功能'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
            <Alert severity="info" sx={{ mb: 3 }}>
              更改套餐可能会影响您的账单和可用功能。如有疑问，请联系客服。
            </Alert>
          </TabPanel>

          {/* 安全设置标签页 */}
          <TabPanel value={tabValue} index={3}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                安全设置
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.security.twoFactor}
                        onChange={(e) => handleSecurityChange('twoFactor', e.target.checked)}
                        disabled={saving}
                      />
                    }
                    label="启用双重认证"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    启用后，用户登录时需要输入短信验证码
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>会话超时时间（分钟）</InputLabel>
                    <Select
                      value={settingsData.security.sessionTimeout}
                      onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                      label="会话超时时间（分钟）"
                      disabled={saving}
                    >
                      <MenuItem value={15}>15分钟</MenuItem>
                      <MenuItem value={30}>30分钟</MenuItem>
                      <MenuItem value={60}>60分钟</MenuItem>
                      <MenuItem value={120}>2小时</MenuItem>
                      <MenuItem value={240}>4小时</MenuItem>
                      <MenuItem value={480}>8小时</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    用户无操作后自动退出登录的时间
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存安全设置'}
              </Button>
            </Box>
          </TabPanel>

          {/* 通知设置标签页 */}
          <TabPanel value={tabValue} index={4}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                通知设置
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.notifications.email}
                        onChange={() => handleNotificationsChange('email')}
                        disabled={saving}
                      />
                    }
                    label="邮件通知"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    新订单、系统通知等将通过邮件发送
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.notifications.sms}
                        onChange={() => handleNotificationsChange('sms')}
                        disabled={saving}
                      />
                    }
                    label="短信通知"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    重要通知将通过短信发送（可能需要额外费用）
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settingsData.notifications.push}
                        onChange={() => handleNotificationsChange('push')}
                        disabled={saving}
                      />
                    }
                    label="推送通知"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    在浏览器或移动设备上显示推送通知
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存通知设置'}
              </Button>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EditTenant;