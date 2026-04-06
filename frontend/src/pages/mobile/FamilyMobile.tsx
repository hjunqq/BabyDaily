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

export const FamilyMobile = () => {
    const [family, setFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [pendingMembers, setPendingMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();

    const [inviteRole, setInviteRole] = useState<FamilyRole>('MEMBER');
    const [invite, setInvite] = useState<FamilyInvite | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copyMsg, setCopyMsg] = useState('');
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

    useEffect(() => { loadData(); }, [loadData]);

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
        if (!confirm(`确定移除 ${nickname || '该成员'}?`)) return;
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
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>加载中...</div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ color: '#e74c3c' }}>{error}</p>
                <button onClick={loadData} style={s.btn}>重试</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '12px 16px', paddingBottom: 40 }}>
            {actionMsg && <div style={s.toast}>{actionMsg}</div>}

            <h2 style={{ fontSize: 20, marginBottom: 2 }}>{family?.name || '家庭管理'}</h2>
            <p style={{ color: '#aaa', fontSize: 11, marginBottom: 16 }}>ID: {familyId?.slice(0, 8)}...</p>

            {/* Invite */}
            <div style={s.card}>
                <div style={s.cardTitle}>邀请新成员</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as FamilyRole)}
                        style={s.select}
                    >
                        {ASSIGNABLE_ROLES.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                    </select>
                    <button onClick={handleCreateInvite} disabled={inviteLoading} style={s.btn}>
                        {inviteLoading ? '...' : '生成邀请码'}
                    </button>
                </div>
                {invite && (
                    <div style={s.inviteBox}>
                        <div style={s.inviteCode}>{invite.code}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button onClick={handleCopyCode} style={s.btnOutline}>
                                {copyMsg || '复制'}
                            </button>
                            <span style={{ fontSize: 11, color: '#888' }}>
                                {ROLE_LABELS[invite.role]} · 24h · 一次性
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Pending */}
            {pendingMembers.length > 0 && (
                <div style={s.card}>
                    <div style={s.cardTitle}>
                        待审批
                        <span style={s.badge}>{pendingMembers.length}</span>
                    </div>
                    {pendingMembers.map(m => (
                        <div key={m.id} style={s.row}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>
                                    {m.user?.nickname || m.user_id.slice(0, 8)}
                                </div>
                                <span style={{ ...s.pill, backgroundColor: ROLE_COLORS[m.role] + '22', color: ROLE_COLORS[m.role] }}>
                                    {ROLE_LABELS[m.role]}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => handleApprove(m.id)} style={s.btnGreen}>批准</button>
                                <button onClick={() => handleReject(m.id)} style={s.btnRed}>拒绝</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Members */}
            <div style={s.card}>
                <div style={s.cardTitle}>成员 ({members.length})</div>
                {members.map(m => (
                    <div key={m.id} style={s.row}>
                        <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>
                                {m.user?.nickname || m.user?.openid?.slice(0, 8) || m.user_id.slice(0, 8)}
                            </div>
                            <span style={{
                                ...s.pill,
                                backgroundColor: ROLE_COLORS[m.role] + '22',
                                color: ROLE_COLORS[m.role],
                            }}>
                                {ROLE_LABELS[m.role]}
                            </span>
                        </div>
                        {m.role !== 'OWNER' && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <select
                                    value={m.role}
                                    onChange={e => handleRoleChange(m.id, e.target.value as FamilyRole)}
                                    style={{ ...s.select, fontSize: 12, padding: '4px 6px' }}
                                >
                                    {ASSIGNABLE_ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleRemove(m.id, m.user?.nickname || undefined)}
                                    style={s.btnRedOutline}
                                >
                                    移除
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ ...s.card, backgroundColor: '#fafafa' }}>
                <div style={s.cardTitle}>角色说明</div>
                <div style={{ fontSize: 12, lineHeight: 1.9, color: '#666' }}>
                    <div><b style={{ color: ROLE_COLORS.OWNER }}>所有者</b> — 全部权限</div>
                    <div><b style={{ color: ROLE_COLORS.GUARDIAN }}>监护人</b> — 管理宝宝信息</div>
                    <div><b style={{ color: ROLE_COLORS.MEMBER }}>成员</b> — 日常记录</div>
                    <div><b style={{ color: ROLE_COLORS.VIEWER }}>观察者</b> — 仅查看</div>
                </div>
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 600,
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
    },
    pill: {
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 500,
        marginTop: 2,
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: '#e74c3c',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
    },
    inviteBox: {
        marginTop: 10,
        padding: '10px 14px',
        backgroundColor: '#f0f7ff',
        borderRadius: 8,
    },
    inviteCode: {
        fontFamily: 'monospace',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 4,
        color: '#2c3e50',
        marginBottom: 6,
    },
    select: {
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #ddd',
        fontSize: 14,
        flex: 1,
    },
    btn: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        backgroundColor: '#3498db',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        whiteSpace: 'nowrap' as const,
    },
    btnOutline: {
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid #3498db',
        backgroundColor: '#fff',
        color: '#3498db',
        fontSize: 12,
    },
    btnGreen: {
        padding: '5px 14px',
        borderRadius: 6,
        border: 'none',
        backgroundColor: '#27ae60',
        color: '#fff',
        fontSize: 12,
    },
    btnRed: {
        padding: '5px 14px',
        borderRadius: 6,
        border: 'none',
        backgroundColor: '#e74c3c',
        color: '#fff',
        fontSize: 12,
    },
    btnRedOutline: {
        padding: '4px 10px',
        borderRadius: 6,
        border: '1px solid #e74c3c',
        backgroundColor: '#fff',
        color: '#e74c3c',
        fontSize: 12,
        whiteSpace: 'nowrap' as const,
    },
    toast: {
        position: 'fixed' as const,
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 20px',
        backgroundColor: '#2c3e50',
        color: '#fff',
        borderRadius: 8,
        fontSize: 13,
        zIndex: 9999,
    },
};
