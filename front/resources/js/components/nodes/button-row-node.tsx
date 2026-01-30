import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function ButtonRowNode({ data, id }: NodeProps<NodeData>) {
    return (
        <div className="group relative rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#334155' }} />
            <NodeActionButtons nodeId={id} canEdit={false} />
            <div className="min-w-fit">
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Rows</div>
                <div className="text-sm font-semibold">{data.label ?? 'Row'}</div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#334155' }} />
        </div>
    );
}
