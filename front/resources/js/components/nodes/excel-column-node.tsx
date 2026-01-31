import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function ExcelColumnNode({ data, id, selected }: NodeProps<NodeData>) {
    const name = (data.columnName || '').trim();

    return (
        <div className="group relative rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#10b981' }} />

            <NodeActionButtons nodeId={id} isVisible={selected} canEdit />

            <div className="min-w-[180px]">
                <div className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Столбец</div>
                <div className="text-sm font-semibold">{name || 'Столбец Excel'}</div>
            </div>

            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#10b981' }} />
        </div>
    );
}

