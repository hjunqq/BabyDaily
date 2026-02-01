import { useState, useRef } from 'react';
import { Popup } from 'devextreme-react/popup';
import { Form, Item, ButtonItem } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import { confirm } from 'devextreme/ui/dialog';
import { BabyService } from '../../services/api';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { API_URL } from '../../config/env';
import notify from 'devextreme/ui/notify';

interface BabyEditModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const BabyEditModal = ({ visible, onClose, onSuccess }: BabyEditModalProps) => {
    const { baby, refresh } = useCurrentBaby();
    const [formData, setFormData] = useState({ ...baby });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await BabyService.updateBaby(baby!.id, {
                name: formData.name,
                birthday: formData.birthday,
                gender: formData.gender
            });
            notify('保存成功', 'success', 2000);
            await refresh();
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            notify('保存失败', 'error', 2000);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !baby) return;

        try {
            await BabyService.uploadAvatar(baby.id, file);
            notify('头像上传成功', 'success', 2000);
            await refresh();
        } catch (error) {
            console.error(error);
            notify('头像上传失败', 'error', 2000);
        }
    };

    const handleClearAllRecords = async () => {
        const result = await confirm(
            '确定要清空该宝宝的所有记录吗？<br><b>此操作不可恢复！</b>', // Message
            '危险操作' // Title
        );

        if (result) {
            try {
                await BabyService.deleteAllRecords(baby!.id);
                notify('记录已全部清空', 'success', 2000);
                onSuccess(); // Trigger refresh of stats
                onClose();
            } catch (error) {
                console.error(error);
                notify('清空失败', 'error', 2000);
            }
        }
    };

    if (!baby) return null;

    return (
        <Popup
            visible={visible}
            onHiding={onClose}
            dragEnabled={false}
            showCloseButton={true}
            showTitle={true}
            title="编辑宝宝信息"
            container=".dx-viewport"
            width={400}
            height="auto"
            contentRender={() => (
                <div className="p-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-6">
                        <div
                            className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity relative group"
                            onClick={handleAvatarClick}
                        >
                            <img
                                src={baby.avatarUrl?.startsWith('http') ? baby.avatarUrl : `${API_URL}${baby.avatarUrl || '/uploads/avatars/default.png'}`}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">更换</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <span className="text-xs text-gray-400 mt-2">点击头像更换</span>
                    </div>

                    <Form formData={formData} onFieldDataChanged={(e) => setFormData({ ...formData, [e.dataField as string]: e.value })}>
                        <Item dataField="name" label={{ text: "昵称" }} editorOptions={{ stylingMode: 'outlined' }} isRequired />
                        <Item
                            dataField="gender"
                            label={{ text: "性别" }}
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: [{ id: 'BOY', text: '男宝' }, { id: 'GIRL', text: '女宝' }],
                                displayExpr: 'text',
                                valueExpr: 'id',
                                stylingMode: 'outlined'
                            }}
                        />
                        <Item dataField="birthday" label={{ text: "生日" }} editorType="dxDateBox" editorOptions={{ stylingMode: 'outlined', type: 'date' }} />

                        <Item itemType="empty" />

                        <ButtonItem horizontalAlignment="center" buttonOptions={{
                            text: "保存修改",
                            type: "default",
                            stylingMode: "contained",
                            width: "100%",
                            onClick: handleSubmit
                        }} />
                    </Form>

                    <div className="mt-8 pt-6 border-t border-red-100">
                        <div className="text-xs font-bold text-red-500 mb-2 uppercase">危险区域</div>
                        <Button
                            text="清空所有记录 (测试数据)"
                            type="danger"
                            stylingMode="outlined"
                            width="100%"
                            onClick={handleClearAllRecords}
                        />
                        <p className="text-xs text-red-300 mt-2 text-center">
                            将删除该宝宝名下的所有喂养、睡眠、尿布记录。
                        </p>
                    </div>
                </div>
            )}
        />
    );
};
