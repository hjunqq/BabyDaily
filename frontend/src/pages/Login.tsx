import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BabyService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export const Login = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectPath = (location.state as any)?.from?.pathname || '/web';

    useEffect(() => {
        if (BabyService.isAuthenticated()) {
            navigate(redirectPath, { replace: true });
        }
    }, [redirectPath, navigate]);

    const handleDevLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await BabyService.ensureDevEnvironment();
            navigate(redirectPath, { replace: true });
        } catch (err: any) {
            setError(err?.message || '登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'A' ? 'bg-sakura-bg' : 'bg-sakura-bg-alt'}`}>
            <div className={`w-full max-w-md rounded-2xl p-8 shadow-xl ${theme === 'A' ? 'bg-white/90 backdrop-blur-md border border-white/70' : 'bg-white border border-gray-200'}`}>
                <div className="text-center mb-6">
                    <div className="text-3xl mb-2">🍼</div>
                    <h1 className="text-2xl font-bold text-sakura-text mb-1">BabyDaily 登录</h1>
                    <p className="text-sm text-sakura-text/70">开发环境使用一键登录创建默认家庭与宝宝</p>
                </div>

                <button
                    onClick={handleDevLogin}
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-sakura-pink hover:bg-sakura-pink/90 shadow-lg shadow-sakura-pink/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? '登录中...' : '一键开发登录'}
                </button>

                <div className="mt-4 text-center text-sm text-gray-500">
                    微信登录即将上线，当前使用开发登录。
                </div>

                {error && (
                    <div className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};
