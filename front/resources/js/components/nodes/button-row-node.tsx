import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeData } from '../types';

export function ButtonRowNode({ data }: NodeProps<NodeData>) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#334155' }}
            />
            <div className="min-w-[140px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rows</div>
                <div className="text-sm font-semibold">{data.label ?? 'Row'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#334155' }}
            />
        </div>
    );
}
