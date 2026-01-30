import { useContext, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import { DownloadIcon, UploadIcon } from '../ui/icons';
import { GraphActionsContext } from './graph-actions-context';
import type { NodeData } from '../types';

const API_BASE = 'http://localhost:8001';

export function TextFileNode({ data, id }: NodeProps<NodeData>) {
    const name = (data.fileName || '').trim();
    const hasFile = Boolean(name);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { onUpdateNode } = useContext(GraphActionsContext);

    const handleDownload = () => {
        if (!hasFile) {
            return;
        }
        const botId = window.localStorage.getItem('botId');
        if (!botId) {
            return;
        }
        const url = `${API_BASE}/bots/${botId}/files/text/${encodeURIComponent(name)}`;
        window.open(url, '_blank');
    };

    const handleUploadClick = () => {
        if (isUploading) {
            return;
        }
        fileInputRef.current?.click();
    };

    const handleUpload = async (file: File) => {
        const botId = window.localStorage.getItem('botId');
        if (!botId) {
            return;
        }
        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const response = await fetch(`${API_BASE}/bots/${botId}/files/text/upload`, {
                method: 'POST',
                body: form,
            });
            if (!response.ok) {
                window.alert('Не удалось загрузить файл.');
                return;
            }
            const payload = (await response.json()) as { name?: string };
            const nextName = payload.name || file.name.replace(/\.txt$/i, '');
            onUpdateNode(id, { fileName: nextName });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="group relative rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(148,163,184,0.2)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#64748b' }} />

            <NodeActionButtons nodeId={id} canEdit />
            <div className="pointer-events-none absolute -top-[8px] right-1 z-10 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-hover:pointer-events-auto">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleUploadClick();
                    }}
                    className="nodrag nopan flex h-4 w-4 items-center justify-center rounded-md bg-slate-700 p-0.5 text-white transition hover:bg-slate-800"
                    aria-label="Upload"
                >
                    <UploadIcon />
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleDownload();
                    }}
                    className="nodrag nopan flex h-4 w-4 items-center justify-center rounded-md bg-slate-600 p-0.5 text-white transition hover:bg-slate-700"
                    aria-label="Download"
                    disabled={!hasFile}
                >
                    <DownloadIcon />
                </button>
            </div>

            <div className="min-w-[180px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">TXT файл</div>
                <div className="text-sm font-semibold">{name || 'Новый файл'}</div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        handleUpload(file);
                    }
                    event.target.value = '';
                }}
            />

            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#64748b' }} />
        </div>
    );
}
