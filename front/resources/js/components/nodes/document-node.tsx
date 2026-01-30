import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function DocumentNode({ data, id }: NodeProps<NodeData>) {
    const count = data.documentUrls?.length ?? 0;
    const label = count === 1 ? '1 файл' : `${count} файлов`;
    return (
        <div className="group relative rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#334155' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Документ</div>
                <div className="text-sm font-semibold">{count ? label : 'Нет файлов'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#334155' }}
            />
        </div>
    );
}
