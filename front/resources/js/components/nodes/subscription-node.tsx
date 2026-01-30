import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function SubscriptionNode({ data, id }: NodeProps<NodeData>) {
    const title = (data.subscriptionChatTitle || '').trim();
    return (
        <div className="group relative rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#059669' }} />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[180px]">
                <div className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Подписка</div>
                <div className="text-sm font-semibold">{title || 'Проверка подписки'}</div>
            </div>
            <Handle
                type="source"
                id="true"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#059669', top: '35%' }}
            />
            <Handle
                type="source"
                id="false"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#059669', top: '65%' }}
            />
        </div>
    );
}
