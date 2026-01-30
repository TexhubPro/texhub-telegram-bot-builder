import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';

type Props = {
    onSave: () => void;
    onSort: () => void;
    onClear: () => void;
    onExport: () => void;
    onImport: () => void;
    logoRight?: string;
};

export function AppNavbar({ onSave, onSort, onClear, onExport, onImport, logoRight = 'n8n' }: Props) {
    return (
        <Navbar className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
            <NavbarBrand className="gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-bold text-white shadow-lg">
                    TB
                </div>
                <div className="flex flex-col font-['Space_Grotesk']">
                    <span className="text-sm font-semibold text-slate-900">Telegram Bot Builder</span>
                    <span className="text-xs text-slate-500">Flow workspace</span>
                </div>
            </NavbarBrand>
            <NavbarContent justify="end" className="gap-2">
                <NavbarItem>
                    <Button size="sm" variant="flat" onPress={onSave}>
                        Сохранить
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <Button size="sm" variant="flat" onPress={onSort}>
                        Сортировать
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <Button size="sm" variant="flat" onPress={onClear}>
                        Очистить
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <Button size="sm" variant="flat" onPress={onExport}>
                        Экспорт
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <Button size="sm" variant="flat" onPress={onImport}>
                        Импорт
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
                        {logoRight}
                    </div>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
}
