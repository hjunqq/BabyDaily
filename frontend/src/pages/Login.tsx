import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BabyService } from '../services/api';
import { useIsMobile } from '../hooks/useIsMobile';

export const Login = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('请输入用户名和密码');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const session = await BabyService.loginAdmin(username.trim(), password);
            navigate(session.onboardingRequired ? '/onboarding' : '/');
        } catch (err: any) {
            setError(err?.message || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    const formContent = (
        <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="管理员用户名"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={styles.input}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <input
                    type="password"
                    placeholder="密码"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={styles.input}
                />
            </div>
            {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? '登录中...' : '管理员登录'}
            </button>
        </form>
    );

    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: '#fff8f5', display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center' }}>
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#2c3e50' }}>BabyDaily</div>
                    <p style={{ marginTop: 12, color: '#6b524b', fontSize: 14 }}>管理员登录</p>
                </div>
                <div style={{ ...styles.card, padding: '30px 20px' }}>
                    {formContent}
                </div>
                <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#999' }}>
                    &copy; 2024 BabyDaily
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr' }}>
            <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#2c3e50' }}>BabyDaily</div>
                <p style={{ marginTop: 24, color: '#6b524b', maxWidth: 420, fontSize: 18, lineHeight: 1.6 }}>
                    轻奢而温柔的记录空间，帮你留住每一个小变化。<br />
                    用心记录，让爱有迹可循。
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff8f5 0%, #f9f0ec 100%)' }}>
                <div style={{ ...styles.card, width: 380, padding: 40 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>管理员登录</h2>
                    <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>使用管理员账号登录，拥有最高权限</p>
                    {formContent}
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    },
    input: {
        width: '100%',
        boxSizing: 'border-box' as const,
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid #d1d5db',
        fontSize: 15,
        outline: 'none',
    },
    btn: {
        width: '100%',
        padding: '12px',
        borderRadius: 8,
        border: 'none',
        backgroundColor: '#3498db',
        color: '#fff',
        fontSize: 16,
        fontWeight: 500,
        cursor: 'pointer',
    },
};
