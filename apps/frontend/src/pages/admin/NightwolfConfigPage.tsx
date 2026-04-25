import React, { useState, useEffect } from 'react';
import { ADMIN_ROUTES } from '../../config/routes';
import { buildApiUrl, NIGHTWOLF_API_ROUTES } from '../../config/api-routes';
import { apiGet, apiPut, apiDelete } from '../../utils/api-client';

// 店铺类别选项
const STORE_TYPES: { key: string; label: string; icon: string }[] = [
  { key: 'RESTAURANT', label: '餐厅', icon: '🍽️' },
  { key: 'FAST_FOOD', label: '快餐', icon: '🍔' },
  { key: 'CAFE', label: '咖啡厅', icon: '☕' },
  { key: 'BAKERY', label: '面包店', icon: '🥐' },
  { key: 'BAR', label: '酒吧', icon: '🍺' },
  { key: 'FOOD_TRUCK', label: '餐车', icon: '🚚' },
  { key: 'CATERING', label: '宴会', icon: '🎉' },
  { key: 'OTHER', label: '其他', icon: '🏪' },
];

// 触发事件选项
const TRIGGER_OPTIONS = [
  { value: 'order_placed', label: '顾客下单' },
  { value: 'order_ready', label: '出餐完成' },
  { value: 'order_cancelled', label: '订单取消' },
  { value: 'item_sold_out', label: '菜品售罄' },
];

// 动作类型选项
const ACTION_TYPES = [
  { value: 'print', label: '🖨️ 打印' },
  { value: 'voice', label: '🔊 语音播报' },
  { value: 'display', label: '🖥️ 叫号大屏' },
  { value: 'alert', label: '⚠️ 告警' },
  { value: 'notify', label: '📱 通知推送' },
];

interface Rule {
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: { type: string; params: Record<string, any> }[];
  timeout: { after_ms: number; action: { type: string; params: Record<string, any> } } | null;
}

interface FlowConfig {
  id: string;
  storeType: string;
  name: string;
  rules: Rule[];
  status: string;
}

const NightwolfConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<FlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // storeType or null
  const [editData, setEditData] = useState<{ name: string; rules: Rule[] }>({ name: '', rules: [] });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await apiGet(buildApiUrl(NIGHTWOLF_API_ROUTES.CONFIGS));
      const data = res?.data || [];
      setConfigs(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: '加载配置失败: ' + (err?.message || '未知错误') });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (storeType: string) => {
    const existing = configs.find(c => c.storeType === storeType);
    setEditing(storeType);
    setEditData({
      name: existing?.name || getDefaultName(storeType),
      rules: existing?.rules || [],
    });
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditData({ name: '', rules: [] });
  };

  const saveConfig = async () => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiPut(buildApiUrl(NIGHTWOLF_API_ROUTES.CONFIG_BY_TYPE, { storeType: editing }), {
        name: editData.name,
        rules: editData.rules,
      });
      const saved = res?.data;
      if (saved) {
        setConfigs(prev => {
          const idx = prev.findIndex(c => c.storeType === editing);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setMessage({ type: 'success', text: `【${getTypeLabel(editing)}】流程配置已保存` });
      }
      setEditing(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: '保存失败: ' + (err?.message || '未知错误') });
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (storeType: string) => {
    if (!confirm(`确定删除【${getTypeLabel(storeType)}】的流程配置？删除后该类别店铺恢复无配置状态。`)) return;
    try {
      await apiDelete(buildApiUrl(NIGHTWOLF_API_ROUTES.CONFIG_BY_TYPE, { storeType }));
      setConfigs(prev => prev.filter(c => c.storeType !== storeType));
      setMessage({ type: 'success', text: `【${getTypeLabel(storeType)}】配置已删除` });
    } catch (err: any) {
      setMessage({ type: 'error', text: '删除失败: ' + (err?.message || '未知错误') });
    }
  };

  // 规则编辑操作
  const addRule = () => {
    setEditData(prev => ({
      ...prev,
      rules: [...prev.rules, {
        name: `新规则 ${prev.rules.length + 1}`,
        trigger: 'order_placed',
        conditions: {},
        actions: [],
        timeout: null,
      }]
    }));
  };

  const updateRule = (index: number, field: string, value: any) => {
    setEditData(prev => {
      const rules = [...prev.rules];
      rules[index] = { ...rules[index], [field]: value };
      return { ...prev, rules };
    });
  };

  const updateAction = (ruleIndex: number, actionIndex: number, field: string, value: any) => {
    setEditData(prev => {
      const rules = [...prev.rules];
      const actions = [...rules[ruleIndex].actions];
      actions[actionIndex] = { ...actions[actionIndex], [field]: value };
      rules[ruleIndex] = { ...rules[ruleIndex], actions };
      return { ...prev, rules };
    });
  };

  const addAction = (ruleIndex: number) => {
    setEditData(prev => {
      const rules = [...prev.rules];
      rules[ruleIndex] = {
        ...rules[ruleIndex],
        actions: [...rules[ruleIndex].actions, { type: 'print', params: { count: 1, target: ['kitchen'] } }]
      };
      return { ...prev, rules };
    });
  };

  const removeAction = (ruleIndex: number, actionIndex: number) => {
    setEditData(prev => {
      const rules = [...prev.rules];
      rules[ruleIndex] = {
        ...rules[ruleIndex],
        actions: rules[ruleIndex].actions.filter((_, i) => i !== actionIndex)
      };
      return { ...prev, rules };
    });
  };

  const removeRule = (index: number) => {
    if (!confirm('确定删除这条规则？')) return;
    setEditData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const toggleTimeout = (ruleIndex: number) => {
    setEditData(prev => {
      const rules = [...prev.rules];
      const rule = rules[ruleIndex];
      if (rule.timeout) {
        rules[ruleIndex] = { ...rule, timeout: null };
      } else {
        rules[ruleIndex] = {
          ...rule,
          timeout: { after_ms: 600000, action: { type: 'alert', params: { target: 'manager' } } }
        };
      }
      return { ...prev, rules };
    });
  };

  const getTypeLabel = (key: string) => STORE_TYPES.find(t => t.key === key)?.label || key;
  const getTypeIcon = (key: string) => STORE_TYPES.find(t => t.key === key)?.icon || '🏪';
  const getDefaultName = (key: string) => `${getTypeLabel(key)}默认流程`;
  const getTriggerLabel = (trigger: string) => TRIGGER_OPTIONS.find(t => t.value === trigger)?.label || trigger;
  const getActionLabel = (type: string) => ACTION_TYPES.find(a => a.value === type)?.label || type;

  const hasConfig = (storeType: string) => configs.some(c => c.storeType === storeType);

  const actionParamsFields = (type: string, params: Record<string, any>, onChange: (field: string, v: any) => void) => {
    switch (type) {
      case 'print':
        return (
          <div className="field-row">
            <label>份数:</label>
            <input type="number" min={1} max={5} value={params.count || 1}
              onChange={e => onChange('count', parseInt(e.target.value) || 1)} />
            <label>打印目标:</label>
            <select multiple value={params.target || []}
              onChange={e => onChange('target', Array.from(e.target.selectedOptions, o => o.value))}
              style={{ height: 60 }}>
              <option value="kitchen">厨房</option>
              <option value="counter">前台</option>
              <option value="counter">收银台</option>
            </select>
          </div>
        );
      case 'voice':
        return (
          <div className="field-row">
            <label>播报内容:</label>
            <input type="text" value={params.message || ''}
              onChange={e => onChange('message', e.target.value)} placeholder="新订单请处理" />
          </div>
        );
      case 'alert':
        return (
          <div className="field-row">
            <label>告警目标:</label>
            <select value={params.target || 'manager'}
              onChange={e => onChange('target', e.target.value)}>
              <option value="manager">经理</option>
              <option value="owner">店主</option>
              <option value="all">所有人</option>
            </select>
          </div>
        );
      case 'notify':
        return (
          <div className="field-row">
            <label>通知目标:</label>
            <select value={params.target || 'waiter_terminal'}
              onChange={e => onChange('target', e.target.value)}>
              <option value="waiter_terminal">服务员终端</option>
              <option value="manager">经理</option>
              <option value="all">所有人</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading">加载中...</div></div>;
  }

  return (
    <div className="page-container">
      <h1>🌙 夜狼 — 业务流程配置</h1>
      <p className="page-desc">为不同类别的店铺配置默认业务流程规则。店铺创建后自动继承所属类别的规则，也可单独覆盖。</p>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <button className="alert-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* 配置列表/编辑区域 */}
      <div className="config-grid">
        {STORE_TYPES.map(type => (
          <div key={type.key} className={`config-card ${hasConfig(type.key) ? 'has-config' : ''} ${expandedType === type.key ? 'expanded' : ''} ${editing === type.key ? 'editing' : ''}`}>
            {/* 卡片头部 — 始终显示 */}
            <div className="card-header" onClick={() => expandedType === type.key ? setExpandedType(null) : setExpandedType(type.key)}>
              <span className="card-icon">{type.icon}</span>
              <div className="card-info">
                <div className="card-title">{type.label}</div>
                <div className="card-subtitle">
                  {hasConfig(type.key)
                    ? `${configs.find(c => c.storeType === type.key)?.name} (${configs.find(c => c.storeType === type.key)?.rules.length} 条规则)`
                    : '未配置'}
                </div>
              </div>
              <div className="card-actions">
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); startEdit(type.key); }}>
                  {hasConfig(type.key) ? '编辑' : '配置'}
                </button>
                {hasConfig(type.key) && (
                  <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); deleteConfig(type.key); }}>删除</button>
                )}
              </div>
            </div>

            {/* 展开详情 — 非编辑状态下显示规则概览 */}
            {expandedType === type.key && editing !== type.key && (
              <div className="card-body">
                {hasConfig(type.key) ? (
                  <div className="rules-list">
                    {configs.find(c => c.storeType === type.key)?.rules.map((rule, idx) => (
                      <div key={idx} className="rule-item">
                        <div className="rule-header">
                          <strong>{rule.name}</strong>
                          <span className="rule-trigger">{getTriggerLabel(rule.trigger)}</span>
                        </div>
                        <div className="rule-actions">
                          {rule.actions.map((a, ai) => (
                            <span key={ai} className="action-badge">{getActionLabel(a.type)}</span>
                          ))}
                          {rule.actions.length === 0 && <span className="text-muted">无动作</span>}
                        </div>
                        {rule.timeout && (
                          <div className="rule-timeout">⏱ 超时 {rule.timeout.after_ms / 1000}秒 → {getActionLabel(rule.timeout.action.type)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">暂无配置，点击"配置"按钮创建</div>
                )}
              </div>
            )}

            {/* 编辑模式 */}
            {editing === type.key && (
              <div className="edit-panel">
                <div className="field-row">
                  <label>配置名称:</label>
                  <input type="text" value={editData.name}
                    onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))} />
                </div>

                <div className="edit-rules">
                  <div className="section-title">
                    <span>流程规则 ({editData.rules.length})</span>
                    <button className="btn btn-sm" onClick={addRule}>+ 添加规则</button>
                  </div>

                  {editData.rules.map((rule, idx) => (
                    <div key={idx} className="rule-edit-card">
                      <div className="rule-edit-header">
                        <input type="text" value={rule.name}
                          onChange={e => updateRule(idx, 'name', e.target.value)}
                          placeholder="规则名称" />
                        <button className="btn btn-sm btn-danger" onClick={() => removeRule(idx)}>删除</button>
                      </div>

                      <div className="field-row">
                        <label>触发事件:</label>
                        <select value={rule.trigger} onChange={e => updateRule(idx, 'trigger', e.target.value)}>
                          {TRIGGER_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="actions-section">
                        <label>执行动作:</label>
                        {rule.actions.map((action, ai) => (
                          <div key={ai} className="action-edit-row">
                            <select value={action.type} onChange={e => {
                              const newParams: Record<string, any> = {};
                              if (e.target.value === 'print') newParams.count = 1;
                              if (e.target.value === 'voice') newParams.message = '新订单';
                              if (e.target.value === 'alert') newParams.target = 'manager';
                              if (e.target.value === 'notify') newParams.target = 'waiter_terminal';
                              updateAction(idx, ai, 'type', e.target.value);
                              updateAction(idx, ai, 'params', newParams);
                            }}>
                              {ACTION_TYPES.map(a => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                              ))}
                            </select>
                            {actionParamsFields(action.type, action.params || {}, (field, v) => {
                              updateAction(idx, ai, 'params', { ...action.params, [field]: v });
                            })}
                            <button className="btn btn-sm btn-danger" onClick={() => removeAction(idx, ai)}>×</button>
                          </div>
                        ))}
                        <button className="btn btn-sm" onClick={() => addAction(idx)}>+ 动作</button>
                      </div>

                      <div className="timeout-section">
                        <label>
                          <input type="checkbox" checked={!!rule.timeout}
                            onChange={() => toggleTimeout(idx)} />
                          超时处理
                        </label>
                        {rule.timeout && (
                          <div className="timeout-fields">
                            <input type="number" min={10} max={3600}
                              value={rule.timeout.after_ms / 1000}
                              onChange={e => updateRule(idx, 'timeout', {
                                ...rule.timeout,
                                after_ms: (parseInt(e.target.value) || 600) * 1000
                              })} />
                            <span>秒后执行</span>
                            <select value={rule.timeout.action.type}
                              onChange={e => updateRule(idx, 'timeout', {
                                ...rule.timeout,
                                action: { type: e.target.value, params: { target: 'manager' } }
                              })}>
                              {ACTION_TYPES.map(a => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {editData.rules.length === 0 && (
                    <div className="text-muted" style={{ padding: '16px 0' }}>暂无规则，点击"添加规则"开始配置</div>
                  )}
                </div>

                <div className="edit-actions">
                  <button className="btn" onClick={saveConfig} disabled={saving}>
                    {saving ? '保存中...' : '💾 保存配置'}
                  </button>
                  <button className="btn btn-secondary" onClick={cancelEdit}>取消</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
        .page-desc { color: #666; margin-bottom: 24px; }
        .loading { text-align: center; padding: 48px; color: #999; }
        .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; position: relative; }
        .alert-success { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .alert-error { background: #fce4ec; color: #c62828; border: 1px solid #f8bbd0; }
        .alert-close { position: absolute; right: 8px; top: 8px; border: none; background: none; font-size: 18px; cursor: pointer; }
        .text-muted { color: #999; }
        .config-grid { display: flex; flex-direction: column; gap: 12px; }
        .config-card { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .config-card.has-config { border-color: #4caf50; }
        .config-card.editing { border-color: #1976d2; box-shadow: 0 2px 8px rgba(25,118,210,0.15); }
        .card-header { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; user-select: none; }
        .card-header:hover { background: #f5f5f5; }
        .card-icon { font-size: 28px; margin-right: 12px; }
        .card-info { flex: 1; }
        .card-title { font-weight: 600; font-size: 15px; }
        .card-subtitle { font-size: 13px; color: #666; margin-top: 2px; }
        .card-actions { display: flex; gap: 8px; }
        .card-body { padding: 0 16px 12px; border-top: 1px solid #eee; }
        .btn { padding: 6px 14px; border: 1px solid #1976d2; background: #1976d2; color: white; border-radius: 4px; cursor: pointer; font-size: 13px; }
        .btn:hover { opacity: 0.9; }
        .btn-sm { padding: 4px 10px; font-size: 12px; }
        .btn-secondary { background: white; color: #666; border-color: #ccc; }
        .btn-danger { background: white; color: #c62828; border-color: #e57373; }
        .btn-danger:hover { background: #fce4ec; }
        .rules-list { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; }
        .rule-item { padding: 8px 12px; background: #f9f9f9; border-radius: 4px; }
        .rule-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .rule-trigger { font-size: 12px; background: #e3f2fd; padding: 1px 8px; border-radius: 10px; color: #1565c0; }
        .rule-actions { display: flex; gap: 6px; margin: 4px 0; }
        .action-badge { font-size: 12px; background: #e8f5e9; padding: 1px 8px; border-radius: 10px; color: #2e7d32; }
        .rule-timeout { font-size: 12px; color: #e65100; margin-top: 4px; }

        /* 编辑面板 */
        .edit-panel { padding: 16px; border-top: 1px solid #e3f2fd; background: #fafbff; }
        .field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .field-row label { font-size: 13px; min-width: 70px; color: #555; }
        .field-row input[type="text"], .field-row input[type="number"], .field-row select { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
        .field-row input[type="text"] { flex: 1; min-width: 150px; }
        .section-title { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 8px; font-weight: 600; }
        .rule-edit-card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; margin-bottom: 10px; background: white; }
        .rule-edit-header { display: flex; gap: 8px; margin-bottom: 8px; }
        .rule-edit-header input { flex: 1; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; }
        .actions-section { margin: 8px 0; }
        .actions-section > label { font-size: 13px; color: #555; display: block; margin-bottom: 4px; }
        .action-edit-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
        .action-edit-row select { padding: 3px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; }
        .timeout-section { margin-top: 8px; }
        .timeout-section label { font-size: 13px; cursor: pointer; }
        .timeout-fields { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
        .timeout-fields input { width: 80px; }
        .edit-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee; }
        select[multiple] { padding: 4px; }
        select[multiple] option { padding: 3px 6px; }
      `}</style>
    </div>
  );
};

export default NightwolfConfigPage;
