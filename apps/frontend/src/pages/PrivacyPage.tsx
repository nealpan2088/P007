import React from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../config/routes';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '60px 24px 100px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#333',
    lineHeight: 1.8,
  },
  header: {
    textAlign: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px',
  },
  updateDate: {
    color: '#999',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#2d2d2d',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #eee',
  },
  text: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
  },
  list: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  backLink: {
    display: 'inline-block',
    marginTop: 48,
    color: '#667eea',
    textDecoration: 'none',
    fontSize: 15,
  },
  highlight: {
    background: '#fff9f0',
    border: '1px solid #ffe0b2',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 14,
    color: '#e65100',
    marginBottom: 16,
    lineHeight: 1.6,
  },
};

const PrivacyPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>麒麟云点餐隐私政策</h1>
        <p style={styles.updateDate}>最后更新：2026年4月27日</p>
      </div>

      <div style={styles.highlight}>
        <strong>提示：</strong>本隐私政策介绍了麒麟云点餐平台（以下简称"本平台"或"我们"）
        如何收集、使用、存储和保护您的个人信息。请您在使用本平台服务前仔细阅读。
        使用本平台即表示您同意本隐私政策的条款。
      </div>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>一、信息收集</h2>
        <p style={styles.text}>1.1 您在注册时提供的信息：邮箱地址、用户名、手机号码（选填）等。</p>
        <p style={styles.text}>1.2 您在使用服务时生成的信息：菜品数据、订单数据、打印机配置等经营相关信息。</p>
        <p style={styles.text}>1.3 系统自动收集的信息：IP地址、浏览器类型、操作系统、访问时间、页面浏览记录等。</p>
        <p style={styles.text}>1.4 我们不会收集您的个人身份敏感信息，如身份证号、银行账户、生物识别信息等，除非法律法规另有要求。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>二、信息使用</h2>
        <p style={styles.text}>2.1 提供、维护和改进本平台服务。</p>
        <p style={styles.text}>2.2 处理您的注册请求，管理您的账号。</p>
        <p style={styles.text}>2.3 向您发送服务相关的通知、更新和安全警告。</p>
        <p style={styles.text}>2.4 分析服务使用情况，优化产品功能和用户体验。</p>
        <p style={styles.text}>2.5 检测和防范欺诈、滥用等违法违规行为。</p>
        <p style={styles.text}>2.6 遵守法律法规的要求。</p>
        <p style={{ ...styles.text, color: '#999', fontSize: 14 }}>
          我们不会将您的个人信息用于本隐私政策未载明的其他目的，除非事先征得您的同意。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>三、信息存储与保护</h2>
        <p style={styles.text}>3.1 您的个人信息存储于中华人民共和国境内的服务器上。未经您的同意，我们不会将数据转移至境外。</p>
        <p style={styles.text}>3.2 我们采用业界通行的安全技术和措施保护您的数据安全，包括：</p>
        <ul style={styles.list}>
          <li style={styles.listItem}>传输层加密（TLS 1.2+）</li>
          <li style={styles.listItem}>数据存储加密</li>
          <li style={styles.listItem}>严格的访问控制和权限管理</li>
          <li style={styles.listItem}>定期安全审计和漏洞扫描</li>
          <li style={styles.listItem}>实时监控和告警系统</li>
        </ul>
        <p style={styles.text}>3.3 尽管我们采取了上述安全措施，但请注意没有绝对安全的网络环境。我们建议您也采取适当的安全措施保护您的账号安全。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>四、信息共享</h2>
        <p style={styles.text}>4.1 我们不会向第三方出售您的个人信息。</p>
        <p style={styles.text}>4.2 在以下情况下，我们可能会共享您的信息：</p>
        <ul style={styles.list}>
          <li style={styles.listItem}>获得您的明确同意；</li>
          <li style={styles.listItem}>根据法律法规或行政机关、司法机关的要求；</li>
          <li style={styles.listItem}>为维护公共安全、社会公共利益的需要；</li>
          <li style={styles.listItem}>为保护本平台或其他用户的生命、财产安全所必需。</li>
        </ul>
        <p style={styles.text}>4.3 我们可能与提供技术服务的第三方合作伙伴共享必要信息（如云服务提供商），但这些合作伙伴须遵守同等的保密义务。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>五、Cookie与追踪技术</h2>
        <p style={styles.text}>
          本平台使用 Cookie 和类似技术以提升用户体验。您可以在浏览器设置中管理 Cookie 偏好。
          关闭 Cookie 可能会影响部分功能的正常使用。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>六、用户权利</h2>
        <p style={styles.text}>您对您的个人信息享有以下权利：</p>
        <ul style={styles.list}>
          <li style={styles.listItem}><strong>查阅权：</strong>您有权查阅我们持有的您的个人信息；</li>
          <li style={styles.listItem}><strong>更正权：</strong>如发现信息不准确，您有权要求更正；</li>
          <li style={styles.listItem}><strong>删除权：</strong>在特定情形下，您有权要求删除您的个人信息；</li>
          <li style={styles.listItem}><strong>撤回同意权：</strong>您有权撤回您对信息收集和使用的同意；</li>
          <li style={styles.listItem}><strong>数据可携带权：</strong>您有权获取您的个人信息副本。</li>
        </ul>
        <p style={styles.text}>
          行使上述权利，请联系我们：<strong>support@qilin-dining.com</strong>。我们将在15个工作日内回复您的请求。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>七、未成年人保护</h2>
        <p style={styles.text}>
          本平台主要面向餐饮商家，不面向未成年人提供服务。如发现我们无意中收集了未成年人的个人信息，
          请立即联系我们，我们将尽快删除相关数据。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>八、政策变更</h2>
        <p style={styles.text}>
          我们可能会不时更新本隐私政策。重大变更将通过平台公告、弹窗提示或邮件等方式通知您。
          变更后的政策自公布之日起生效。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>九、联系方式</h2>
        <p style={styles.text}>
          如对本隐私政策有任何疑问、意见或投诉，请通过以下方式联系我们：
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>邮箱：support@qilin-dining.com</li>
          <li style={styles.listItem}>电话：400-888-8888</li>
        </ul>
      </section>

      <div style={{ textAlign: 'center' }}>
        <Link to={PUBLIC_ROUTES.AUTH.REGISTER} style={styles.backLink}>← 返回注册</Link>
        <span style={{ margin: '0 16px', color: '#ddd' }}>|</span>
        <Link to={PUBLIC_ROUTES.PUBLIC.TERMS} style={styles.backLink}>查看服务条款 →</Link>
      </div>
    </div>
  );
};

export default PrivacyPage;
