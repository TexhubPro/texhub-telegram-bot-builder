import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function MessageButtonNode({ data, id }: NodeProps<NodeData>) {
    return (
        <div className="relative rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-[0_10px_24px_rgba(14,165,233,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0284c7' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[160px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">Message Button</div>
                <div className="text-sm font-semibold">{data.buttonText ?? 'Кнопка'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0284c7' }}
            />
        </div>
    );
}
