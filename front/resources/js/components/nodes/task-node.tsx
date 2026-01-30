import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeActionButtons } from './node-action-buttons';
import type { NodeData } from '../types';

const intervalLabels: Record<number, string> = {
    1: 'Каждую минуту',
    5: 'Каждые 5 минут',
    10: 'Каждые 10 минут',
    20: 'Каждые 20 минут',
    30: 'Каждые 30 минут',
    60: 'Каждый час',
    120: 'Каждые 2 часа',
    360: 'Каждые 6 часов',
    1440: 'Каждый день',
};

export function TaskNode({ data, id }: NodeProps<NodeData>) {
    const scheduleType = data.taskScheduleType || 'interval';
    const intervalMinutes = data.taskIntervalMinutes ?? 60;
    const dailyTime = (data.taskDailyTime || '').trim();
    const runAt = (data.taskRunAt || '').trim();

    const subtitle = (() => {
        if (scheduleType === 'daily') {
            return dailyTime ? `Каждый день в ${dailyTime}` : 'Каждый день';
        }
        if (scheduleType === 'datetime') {
            return runAt ? `Запуск: ${runAt}` : 'Запуск';
        }
        return intervalLabels[intervalMinutes] || `Интервал ${intervalMinutes} мин`;
    })();

    return (
        <div className="group relative rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[0_10px_24px_rgba(251,191,36,0.18)]">
            <NodeActionButtons nodeId={id} canEdit />
            <div className="min-w-[200px]">
                <div className="text-xs font-semibold tracking-wide text-amber-600 uppercase">Задача</div>
                <div className="text-sm font-semibold">{subtitle}</div>
            </div>
            <Handle type="source" position={Position.Right} style={{ width: 12, height: 12, borderWidth: 2, background: '#d97706' }} />
        </div>
    );
}
