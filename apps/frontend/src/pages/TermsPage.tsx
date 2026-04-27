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
};

const TermsPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>麒麟云点餐服务条款</h1>
        <p style={styles.updateDate}>最后更新：2026年4月27日</p>
      </div>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>一、总则</h2>
        <p style={styles.text}>
          欢迎使用麒麟云点餐平台（以下简称"本平台"）。本平台由麒麟科技提供运营和技术支持。
          请您仔细阅读以下条款。使用本平台即表示您同意接受本服务条款的约束。如果您不同意本条款的任何内容，
          请勿注册或使用本平台服务。
        </p>
        <p style={styles.text}>
          本平台是一款面向餐饮商家的多店铺扫码点餐与云打印SaaS服务平台，
          致力于帮助中小餐饮商家实现数字化经营，提升运营效率。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>二、账号注册与管理</h2>
        <p style={styles.text}>2.1 用户在注册时应提供真实、准确、完整的注册信息，并在信息变更后及时更新。</p>
        <p style={styles.text}>2.2 用户应妥善保管账号和密码，对使用该账号进行的所有行为负全部责任。如发现账号被盗用，应立即通知本平台。</p>
        <p style={styles.text}>2.3 每个用户可以注册一个账号。同一主体注册多个账号的，本平台有权予以合并或关闭。</p>
        <p style={styles.text}>2.4 连续180天未登录的账号，本平台保留注销的权利。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>三、服务内容</h2>
        <p style={styles.text}>3.1 本平台为商家提供包括但不限于：扫码点餐、云端打印、订单管理、菜单管理、数据统计等功能。</p>
        <p style={styles.text}>3.2 本平台根据不同套餐提供差异化的功能和服务，具体以购买页面展示为准。</p>
        <p style={styles.text}>3.3 本平台保留根据业务发展需要调整、变更服务内容的权利，重大变更将提前通过平台公告通知用户。</p>
        <p style={styles.text}>3.4 本平台不直接参与商家的餐饮经营活动，商家与顾客之间的交易纠纷由商家自行处理。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>四、用户权利与义务</h2>
        <p style={styles.text}>4.1 用户有权按照本平台规定使用各项服务。</p>
        <p style={styles.text}>4.2 用户不得利用本平台从事违法违规活动，包括但不限于：</p>
        <ul style={styles.list}>
          <li style={styles.listItem}>传播违法信息、淫秽色情内容；</li>
          <li style={styles.listItem}>侵犯他人知识产权、商业秘密等合法权益；</li>
          <li style={styles.listItem}>从事任何可能破坏平台安全、干扰平台正常运行的行为；</li>
          <li style={styles.listItem}>利用平台进行非法集资、传销等活动；</li>
          <li style={styles.listItem}>其他违反法律法规的行为。</li>
        </ul>
        <p style={styles.text}>4.3 用户应确保其上传的菜品信息、价格等信息真实、准确，不得存在虚假宣传或价格欺诈。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>五、知识产权</h2>
        <p style={styles.text}>5.1 本平台的所有权、运营权及相关知识产权归麒麟科技所有。</p>
        <p style={styles.text}>5.2 用户在本平台发布的菜品图片、菜名等内容，其知识产权归用户所有。用户授予本平台在平台范围内免费使用、展示这些内容的权利。</p>
        <p style={styles.text}>5.3 未经本平台书面同意，任何人不得以任何方式复制、传播、修改、反编译本平台的软件和内容。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>六、数据与隐私保护</h2>
        <p style={styles.text}>6.1 本平台重视用户隐私保护，具体隐私政策请参阅《隐私政策》。</p>
        <p style={styles.text}>6.2 本平台采取符合行业标准的安全措施保护用户数据安全，包括但不限于数据加密、访问控制、备份恢复等。</p>
        <p style={styles.text}>6.3 用户对其店铺产生的经营数据享有所有权。用户停止使用本平台后，可在合理期限内申请导出数据。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>七、费用与支付</h2>
        <p style={styles.text}>7.1 本平台提供免费和付费两种服务模式。付费服务的费用标准以购买页面展示为准。</p>
        <p style={styles.text}>7.2 用户应按时足额支付服务费用。逾期未支付的，本平台有权暂停服务。</p>
        <p style={styles.text}>7.3 除非因本平台原因导致服务无法正常提供，已支付的费用原则上不予退还。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>八、免责声明</h2>
        <p style={styles.text}>8.1 本平台尽力保障服务的稳定性和安全性，但不对因不可抗力、系统维护、网络故障等原因导致的服务中断承担责任。</p>
        <p style={styles.text}>8.2 本平台不对用户使用服务产生的间接损失承担责任，包括但不限于利润损失、业务中断等。</p>
        <p style={styles.text}>8.3 本平台不对第三方服务（如支付通道、短信通道等）的可用性和安全性承担责任。</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>九、条款变更</h2>
        <p style={styles.text}>
          本平台有权根据法律法规变化和业务发展需要修改本服务条款。修改后的条款将在平台公布，公布后继续使用本平台服务即视为接受修改。
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>十、法律适用与争议解决</h2>
        <p style={styles.text}>10.1 本条款适用中华人民共和国法律。</p>
        <p style={styles.text}>10.2 因本条款引起的或与本条款有关的争议，双方应友好协商解决；协商不成的，提交本平台运营方所在地有管辖权的人民法院诉讼解决。</p>
      </section>

      <div style={{ textAlign: 'center' }}>
        <Link to={PUBLIC_ROUTES.AUTH.REGISTER} style={styles.backLink}>← 返回注册</Link>
        <span style={{ margin: '0 16px', color: '#ddd' }}>|</span>
        <Link to={PUBLIC_ROUTES.PUBLIC.PRIVACY} style={styles.backLink}>查看隐私政策 →</Link>
      </div>
    </div>
  );
};

export default TermsPage;
