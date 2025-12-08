import { useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Camera, Tag, Heart, Upload, Trash2 } from 'lucide-react';
import { useOotdData } from '../hooks/useOotdData';
import { CardSkeleton, EmptyState, ErrorState, Button, IconButton } from '../components/common';
import { OotdService } from '../services/ootd';

export const Ootd = () => {
    const { theme } = useTheme();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { loading, error, items, handleLike, handleDelete, babyId, refresh } = useOotdData(
        selectedTags.length > 0 ? selectedTags : undefined
    );

    const allTags = ['全部', '公主风', '运动', '居家', '休闲', '可爱', '帽子', '粉色', '出门'];

    const handleTagClick = (tag: string) => {
        if (tag === '全部') {
            setSelectedTags([]);
        } else {
            setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !babyId) return;
        const fileArr = Array.from(files);
        const invalid = fileArr.find(f => !f.type.startsWith('image/') || f.size > 2 * 1024 * 1024);
        if (invalid) {
            alert('仅支持图片文件，大小不超过 2MB');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        try {
            await OotdService.uploadOotd({
                baby_id: babyId,
                files,
                tags: selectedTags,
            });
            await refresh();
        } catch (err: any) {
            alert(err.message || '上传失败');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredData = selectedTags.length === 0
        ? items
        : items.filter(item => item.tags.some(tag => selectedTags.includes(tag)));

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in p-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-sakura-text flex items-center gap-2">
                            <Camera className="text-sakura-pink" size={28} />
                            宝宝今日穿搭 (OOTD)
                        </h1>
                        <p className="text-sakura-text/60 text-sm mt-1">记录宝宝每天的可爱穿搭瞬间</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState
                type="server"
                message={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="space-y-8 animate-fade-in p-2">
            {/* 头部 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-sakura-text flex items-center gap-2">
                        <Camera className="text-sakura-pink" size={28} />
                        宝宝今日穿搭 (OOTD)
                    </h1>
                    <p className="text-sakura-text/60 text-sm mt-1">记录宝宝每天的可爱穿搭瞬间</p>
                </div>

                <Button
                    variant="primary"
                    icon={<Upload size={18} />}
                    onClick={handleUploadClick}
                    aria-label="上传穿搭照片"
                >
                    上传照片
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUploadChange}
                />
            </div>

            {/* 标签筛选 */}
            <div className="flex gap-2 overflow-x-auto pb-2 w-full hide-scrollbar">
                {allTags.map(tag => {
                    const isSelected = tag === '全部' ? selectedTags.length === 0 : selectedTags.includes(tag);
                    return (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all min-h-[44px] ${isSelected
                                ? 'bg-sakura-pink text-white shadow-lg shadow-sakura-pink/30'
                                : theme === 'A'
                                    ? 'bg-white/40 text-sakura-text/70 hover:bg-white/60'
                                    : 'bg-white text-sakura-text/70 hover:bg-gray-50 border border-gray-200'
                                }`}
                            aria-label={`筛选标签 ${tag}`}
                            aria-pressed={isSelected}
                        >
                            {tag}
                        </button>
                    );
                })}
            </div>

            {/* OOTD 网格 */}
            {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredData.map(item => (
                        <div
                            key={item.id}
                            className={`group relative rounded-3xl p-4 transition-all duration-300 hover:-translate-y-2 ${theme === 'A'
                                ? 'glass-panel hover:shadow-xl'
                                : 'bg-white shadow-sm border border-gray-100 hover:shadow-md'
                                }`}
                        >
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gray-100 relative">
                                <img
                                    src={item.thumbnail_url || item.image_url}
                                    alt={`OOTD ${item.date}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />

                                <button
                                    onClick={() => handleLike(item.id)}
                                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold text-sakura-text hover:bg-white transition-all min-h-[36px]"
                                    aria-label={`点赞，当前${item.likes}个赞`}
                                >
                                    <Heart size={14} className="fill-red-400 text-red-400" />
                                    {item.likes}
                                </button>

                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IconButton
                                        icon={<Trash2 size={16} />}
                                        label="删除照片"
                                        onClick={() => handleDelete(item.id)}
                                        variant="danger"
                                        size="sm"
                                        className="bg-white/90 backdrop-blur-sm hover:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {item.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="text-[10px] px-2 py-1 rounded-md bg-sakura-bg text-sakura-text font-medium flex items-center gap-1"
                                    >
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="text-xs text-sakura-text/60 font-medium text-right">
                                {new Date(item.date).toLocaleDateString('zh-CN')}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    type="no-results"
                    title="没有找到穿搭"
                    description="试试调整筛选标签或上传新的照片"
                    action={{
                        label: '上传第一张照片',
                        onClick: handleUploadClick,
                    }}
                />
            )}
        </div>
    );
};
