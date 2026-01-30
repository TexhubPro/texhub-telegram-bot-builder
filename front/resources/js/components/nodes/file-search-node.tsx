import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function FileSearchNode({ data, id }: NodeProps<NodeData>) {
    const column = (data.searchColumnName || '').trim();

    return (
        <div className="group relative rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 shadow-[0_10px_24px_rgba(20,184,166,0.18)]">
            <Handle
                type="target"
                id="input"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0d9488', top: '35%' }}
            />
            <Handle
                type="target"
                id="file"
                position={Position.Left}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0d9488', top: '65%' }}
            />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[180px]">
                <div className="text-xs font-semibold tracking-wide text-teal-600 uppercase">Поиск</div>
                <div className="text-sm font-semibold">Поиск в файле</div>
                {column ? <div className="text-xs text-teal-600">Столбец: {column}</div> : null}
            </div>
            <Handle
                type="source"
                id="true"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0d9488', top: '35%' }}
            />
            <Handle
                type="source"
                id="false"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#0d9488', top: '65%' }}
            />
        </div>
    );
}
