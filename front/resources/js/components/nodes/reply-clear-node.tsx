import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function ReplyClearNode({ id }: NodeProps<NodeData>) {
    return (
        <div className="group relative rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-[0_10px_24px_rgba(248,113,113,0.2)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#dc2626' }}
            />
            <NodeActionButtons nodeId={id} canEdit={false} />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-red-600">Clear Reply</div>
                <div className="text-sm font-semibold">Очистить Reply</div>
            </div>
        </div>
    );
}
