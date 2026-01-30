import { useContext, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import { DownloadIcon, UploadIcon } from '../ui/icons';
import { GraphActionsContext } from './graph-actions-context';
import type { NodeData } from '../types';

const API_BASE = 'https://toocars.tj';

export function ExcelFileNode({ data, id }: NodeProps<NodeData>) {
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
        const url = `${API_BASE}/bots/${botId}/files/excel/${encodeURIComponent(name)}`;
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
        const lower = file.name.toLowerCase();
        const isExcel = lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls');
        if (!isExcel) {
            window.alert('Загрузите CSV, XLSX или XLS файл.');
            return;
        }
        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const response = await fetch(`${API_BASE}/bots/${botId}/files/excel/upload`, {
                method: 'POST',
                body: form,
            });
            if (!response.ok) {
                window.alert('Не удалось загрузить файл.');
                return;
            }
            const payload = (await response.json()) as { name?: string };
            const nextName = payload.name || file.name.replace(/\.csv$/i, '');
            onUpdateNode(id, { fileName: nextName });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="group relative rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#059669' }} />

            <NodeActionButtons nodeId={id} canEdit />
            <div className="pointer-events-none absolute -top-[8px] right-1 z-10 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-hover:pointer-events-auto">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleUploadClick();
                    }}
                    className="nodrag nopan flex h-4 w-4 items-center justify-center rounded-md bg-emerald-700 p-0.5 text-white transition hover:bg-emerald-800"
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
                    className="nodrag nopan flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 p-0.5 text-white transition hover:bg-emerald-700"
                    aria-label="Download"
                    disabled={!hasFile}
                >
                    <DownloadIcon />
                </button>
            </div>

            <div className="min-w-[180px]">
                <div className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Excel С„Р°Р№Р»</div>
                <div className="text-sm font-semibold">{name || 'Р¤Р°Р№Р» Excel'}</div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        handleUpload(file);
                    }
                    event.target.value = '';
                }}
            />

            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#059669' }} />
        </div>
    );
}


