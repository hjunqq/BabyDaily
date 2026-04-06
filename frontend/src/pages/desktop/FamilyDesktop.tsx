import { useEffect, useState, useCallback } from 'react';
import { BabyService } from '../../services/api';
import type { Family, FamilyMember, FamilyInvite, FamilyRole } from '../../types';

const ROLE_LABELS: Record<FamilyRole, string> = {
    OWNER: '所有者',
    GUARDIAN: '监护人',
    MEMBER: '成员',
    VIEWER: '观察者',
};

const ROLE_COLORS: Record<FamilyRole, string> = {
    OWNER: '#e74c3c',
    GUARDIAN: '#f39c12',
    MEMBER: '#3498db',
    VIEWER: '#95a5a6',
};

const ASSIGNABLE_ROLES: FamilyRole[] = ['GUARDIAN', 'MEMBER', 'VIEWER'];

export const FamilyDesktop = () => {
    const [family, setFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [pendingMembers, setPendingMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();

    // Invite state
    const [inviteRole, setInviteRole] = useState<FamilyRole>('MEMBER');
    const [invite, setInvite] = useState<FamilyInvite | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copyMsg, setCopyMsg] = useState('');

    // Action feedback
    const [actionMsg, setActionMsg] = useState('');

    const familyId = BabyService.getCurrentFamilyId();

    const loadData = useCallback(async () => {
        if (!familyId) {
            setError('未找到当前家庭');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [fams, mems, pending] = await Promise.all([
                BabyService.getFamilies(),
                BabyService.getMembers(familyId),
                BabyService.getPendingMembers(familyId).catch(() => []),
            ]);
            setFamily(fams.find(f => f.id === familyId) || null);
            setMembers(mems);
            setPendingMembers(pending);
            setError(undefined);
        } catch (err: any) {
            setError(err?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    }, [familyId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showAction = (msg: string) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 3000);
    };

    const handleCreateInvite = async () => {
        if (!familyId) return;
        setInviteLoading(true);
        try {
            const inv = await BabyService.createInvite(familyId, inviteRole);
            setInvite(inv);
        } catch (err: any) {
            showAction(err?.message || '生成邀请码失败');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!invite) return;
        try {
            await navigator.clipboard.writeText(invite.code);
            setCopyMsg('已复制!');
            setTimeout(() => setCopyMsg(''), 2000);
        } catch {
            setCopyMsg('复制失败');
        }
    };

    const handleApprove = async (memberId: string) => {
        if (!familyId) return;
        try {
            await BabyService.approveMember(familyId, memberId);
            showAction('已批准');
            loadData();
        } catch (err: any) {
            showAction(err?.message || '操作失败');
        }
    };

    const handleReject = async (memberId: string) => {
        if (!familyId) return;
        if (!confirm('确定拒绝此成员?')) return;
        try {
            await BabyService.rejectMember(familyId, memberId);
            showAction('已拒绝');
            loadData();
        } catch (err: any) {
            showAction(err?.message || '操作失败');
        }
    };

    const handleRoleChange = async (memberId: string, newRole: FamilyRole) => {
        if (!familyId) return;
        try {
            await BabyService.updateMemberRole(familyId, memberId, newRole);
            showAction('角色已更新');
            loadData();
        } catch (err: any) {
            showAction(err?.message || '操作失败');
        }
    };

    const handleRemove = async (memberId: string, nickname?: string) => {
        if (!familyId) return;
        if (!confirm(`确定移除成员 ${nickname || memberId}?`)) return;
        try {
            await BabyService.removeMember(familyId, memberId);
            showAction('已移除');
            loadData();
        } catch (err: any) {
            showAction(err?.message || '操作失败');
        }
    };

    if (loading) {
        return (
            <div className="bd-state">
                <div className="bd-state-card">
                    <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bd-state">
                <div className="bd-state-card">
                    <h3>加载失败</h3>
                    <p style={{ color: '#6b524b' }}>{error}</p>
                    <button onClick={loadData} style={styles.btnPrimary}>重试</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
            <h2 style={{ fontSize: 24, marginBottom: 4 }}>{family?.name || '家庭管理'}</h2>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>ID: {familyId}</p>

            {actionMsg && (
                <div style={styles.toast}>{actionMsg}</div>
            )}

            {/* Invite Code Section */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>邀请新成员</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 14 }}>
                        角色:
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as FamilyRole)}
                            style={styles.select}
                        >
                            {ASSIGNABLE_ROLES.map(r => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        onClick={handleCreateInvite}
                        disabled={inviteLoading}
                        style={styles.btnPrimary}
                    >
                        {inviteLoading ? '生成中...' : '生成邀请码'}
                    </button>
                </div>
                {invite && (
                    <div style={styles.inviteBox}>
                        <span style={styles.inviteCode}>{invite.code}</span>
                        <button onClick={handleCopyCode} style={styles.btnSmall}>
                            {copyMsg || '复制'}
                        </button>
                        <span style={{ fontSize: 12, color: '#888' }}>
                            {ROLE_LABELS[invite.role]} · 24小时有效 · 一次性
                        </span>
                    </div>
                )}
            </div>

            {/* Pending Members */}
            {pendingMembers.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        待审批
                        <span style={styles.badge}>{pendingMembers.length}</span>
                    </h3>
                    {pendingMembers.map(m => (
                        <div key={m.id} style={styles.memberRow}>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 500 }}>
                                    {m.user?.nickname || m.user?.openid?.slice(0, 8) || m.user_id.slice(0, 8)}
                                </span>
                                <span style={{ ...styles.rolePill, backgroundColor: ROLE_COLORS[m.role] + '22', color: ROLE_COLORS[m.role] }}>
                                    {ROLE_LABELS[m.role]}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleApprove(m.id)} style={styles.btnApprove}>批准</button>
                                <button onClick={() => handleReject(m.id)} style={styles.btnReject}>拒绝</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Active Members */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>成员列表 ({members.length})</h3>
                {members.map(m => (
                    <div key={m.id} style={styles.memberRow}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 500 }}>
                                {m.user?.nickname || m.user?.openid?.slice(0, 8) || m.user_id.slice(0, 8)}
                            </span>
                            <span style={{
                                ...styles.rolePill,
                                backgroundColor: ROLE_COLORS[m.role] + '22',
                                color: ROLE_COLORS[m.role],
                            }}>
                                {ROLE_LABELS[m.role]}
                            </span>
                        </div>
                        {m.role !== 'OWNER' && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <select
                                    value={m.role}
                                    onChange={e => handleRoleChange(m.id, e.target.value as FamilyRole)}
                                    style={styles.selectSmall}
                                >
                                    {ASSIGNABLE_ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleRemove(m.id, m.user?.nickname || undefined)}
                                    style={styles.btnDanger}
                                >
                                    移除
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Role Legend */}
            <div style={{ ...styles.section, backgroundColor: '#f8f8f8' }}>
                <h3 style={styles.sectionTitle}>角色说明</h3>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666' }}>
                    <div><b style={{ color: ROLE_COLORS.OWNER }}>所有者</b> — 全部权限，管理成员和角色</div>
                    <div><b style={{ color: ROLE_COLORS.GUARDIAN }}>监护人</b> — 管理宝宝信息，导入/导出数据</div>
                    <div><b style={{ color: ROLE_COLORS.MEMBER }}>成员</b> — 记录日常（喂奶、换尿布等）</div>
                    <div><b style={{ color: ROLE_COLORS.VIEWER }}>观察者</b> — 仅查看，不可编辑</div>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    memberRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #f0f0f0',
    },
    rolePill: {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        backgroundColor: '#e74c3c',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
    },
    inviteBox: {
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: '#f0f7ff',
        borderRadius: 8,
        flexWrap: 'wrap' as const,
    },
    inviteCode: {
        fontFamily: 'monospace',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 3,
        color: '#2c3e50',
    },
    select: {
        marginLeft: 8,
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #ddd',
        fontSize: 14,
    },
    selectSmall: {
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid #ddd',
        fontSize: 13,
    },
    btnPrimary: {
        padding: '8px 20px',
        borderRadius: 8,
        border: 'none',
        backgroundColor: '#3498db',
        color: '#fff',
        fontSize: 14,
        cursor: 'pointer',
        fontWeight: 500,
    },
    btnSmall: {
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid #3498db',
        backgroundColor: '#fff',
        color: '#3498db',
        fontSize: 13,
        cursor: 'pointer',
    },
    btnApprove: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        backgroundColor: '#27ae60',
        color: '#fff',
        fontSize: 13,
        cursor: 'pointer',
    },
    btnReject: {
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        backgroundColor: '#e74c3c',
        color: '#fff',
        fontSize: 13,
        cursor: 'pointer',
    },
    btnDanger: {
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid #e74c3c',
        backgroundColor: '#fff',
        color: '#e74c3c',
        fontSize: 13,
        cursor: 'pointer',
    },
    toast: {
        position: 'fixed' as const,
        top: 20,
        right: 20,
        padding: '10px 20px',
        backgroundColor: '#2c3e50',
        color: '#fff',
        borderRadius: 8,
        fontSize: 14,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
};
