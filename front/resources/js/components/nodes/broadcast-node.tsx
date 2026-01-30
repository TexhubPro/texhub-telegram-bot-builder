import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function BroadcastNode({ id }: NodeProps<NodeData>) {
    return (
        <div className="group relative rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-[0_10px_24px_rgba(129,140,248,0.2)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#6366f1' }} />
            <NodeActionButtons nodeId={id} />
            <div className="min-w-[180px]">
                <div className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">Рассылка</div>
                <div className="text-sm font-semibold">Отправит всем </div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#6366f1' }} />
        </div>
    );
}
