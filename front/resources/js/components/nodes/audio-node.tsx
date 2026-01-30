import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function AudioNode({ data, id }: NodeProps<NodeData>) {
    const count = data.audioUrls?.length ?? 0;
    const label = count === 1 ? '1 аудио' : `${count} аудио`;
    return (
        <div className="group relative rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[0_10px_24px_rgba(251,191,36,0.18)]">
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#d97706' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">Аудио</div>
                <div className="text-sm font-semibold">{count ? label : 'Нет аудио'}</div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#d97706' }}
            />
        </div>
    );
}
