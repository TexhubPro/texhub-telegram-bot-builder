import { Button, Drawer, DrawerBody, DrawerContent, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';
import { useState } from 'react';

type Props = {
    onSave: () => void;
    onSort: () => void;
    onClear: () => void;
    onExport: () => void;
    onImport: () => void;
    logoRight?: string;
};

export function AppNavbar({ onSave, onSort, onClear, onExport, onImport, logoRight = 'n8n' }: Props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <>
            <Navbar className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
                <NavbarBrand className="gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-bold text-white shadow-lg">
                        TB
                    </div>
                    <div className="flex flex-col font-['Space_Grotesk']">
                        <span className="text-sm font-semibold text-slate-900">Telegram Bot Builder</span>
                        <span className="hidden text-xs text-slate-500 sm:block">Flow workspace</span>
                    </div>
                </NavbarBrand>
                <NavbarContent justify="end" className="hidden gap-2 md:flex">
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
                </NavbarContent>

                <NavbarContent justify="end" className="md:hidden">
                    <Button size="sm" variant="flat" isIconOnly onPress={() => setIsMenuOpen(true)} aria-label="Открыть меню">
                        <span className="text-lg leading-none">☰</span>
                    </Button>
                </NavbarContent>
            </Navbar>
            <Drawer
                isOpen={isMenuOpen}
                placement="top"
                size="sm"
                onOpenChange={(open) => {
                    if (!open) {
                        setIsMenuOpen(false);
                    }
                }}
            >
                <DrawerContent>
                    {() => (
                        <DrawerBody className="px-4 pt-2 pb-4">
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        onSave();
                                    }}
                                >
                                    Сохранить
                                </Button>

                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        onSort();
                                    }}
                                >
                                    Сортировать
                                </Button>

                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        onClear();
                                    }}
                                >
                                    Очистить
                                </Button>

                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        onExport();
                                    }}
                                >
                                    Экспорт
                                </Button>

                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        onImport();
                                    }}
                                >
                                    Импорт
                                </Button>
                            </div>
                        </DrawerBody>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
