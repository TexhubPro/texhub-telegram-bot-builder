import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeData } from '../types';

export function ReplyButtonNode({ data }: NodeProps<NodeData>) {
    return (
        <div className="rounded-lg border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-900 shadow-[0_10px_24px_rgba(132,204,22,0.2)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#65a30d' }}
            />
            <div className="min-w-[160px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-lime-600">Reply Button</div>
                <div className="text-sm font-semibold">{data.buttonText ?? 'Кнопка'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#65a30d' }}
            />
        </div>
    );
}
