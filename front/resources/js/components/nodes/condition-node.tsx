import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

export function ConditionNode({ data, id }: NodeProps<NodeData>) {
    const text = (data.conditionText || '').trim();
    const typeLabel = (() => {
        switch (data.conditionType) {
            case 'text':
                return text ? `= ${text}` : 'Текст';
            case 'status':
                return text ? `Статус = ${text}` : 'Статус';
            case 'has_text':
                return 'Есть текст';
            case 'has_number':
                return 'Есть номер';
            case 'has_photo':
                return 'Есть фото';
            case 'has_video':
                return 'Есть видео';
            case 'has_audio':
                return 'Есть аудио';
            case 'has_location':
                return 'Есть гео';
            default:
                return text ? `= ${text}` : 'Нет условия';
        }
    })();
    const opMap: Record<string, string> = {
        lt: '<',
        lte: '<=',
        eq: '=',
        gte: '>=',
        gt: '>',
    };
    const lengthLabel =
        data.conditionLengthOp && data.conditionLengthValue !== undefined
            ? `${opMap[data.conditionLengthOp] ?? data.conditionLengthOp} ${data.conditionLengthValue}`
            : '';
    return (
        <div className="group relative rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-900 shadow-[0_10px_24px_rgba(217,70,239,0.18)]">
            <Handle type="target" position={Position.Left} style={{ width: 12, height: 12, borderWidth: 2, background: '#c026d3' }} />
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[170px]">
                <div className="text-xs font-semibold tracking-wide text-fuchsia-600 uppercase">Проверка</div>
                <div className="text-sm font-semibold">{typeLabel}</div>
                {(data.conditionType === 'has_text' || data.conditionType === 'has_number') && lengthLabel ? (
                    <div className="text-xs text-fuchsia-600">Длина {lengthLabel}</div>
                ) : null}
            </div>
            <Handle
                type="source"
                id="true"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#c026d3', top: '35%' }}
            />
            <Handle
                type="source"
                id="false"
                position={Position.Right}
                style={{ width: 12, height: 12, borderWidth: 2, background: '#c026d3', top: '65%' }}
            />
        </div>
    );
}
