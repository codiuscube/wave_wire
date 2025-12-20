import { createPortal } from 'react-dom';
import { Drawer } from 'vaul';
import { CloseCircle } from '@solar-icons/react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/utils';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  /** Custom z-index, defaults to 50 */
  zIndex?: number;
  /** Custom indicator color class, defaults to 'bg-primary' */
  indicatorColor?: string;
  /** Custom header element - if provided, replaces the default header */
  header?: React.ReactNode;
  /** Custom footer element */
  footer?: React.ReactNode;
}

function SheetHeader({
  title,
  description,
  onClose,
  indicatorColor = 'bg-primary',
}: {
  title?: string;
  description?: string;
  onClose: () => void;
  indicatorColor?: string;
}) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
      <div>
        {title && (
          <div className="flex items-center gap-3 mb-1">
            <div className={cn('w-2.5 h-2.5 animate-pulse', indicatorColor)} />
            <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">
              {title}
            </h2>
          </div>
        )}
        {description && (
          <p className="font-mono text-sm text-muted-foreground/60">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
      >
        <CloseCircle weight="BoldDuotone" size={24} />
      </button>
    </div>
  );
}

function DesktopModal({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
  zIndex = 50,
  indicatorColor,
  header,
  footer,
}: SheetProps) {
  console.log('[DesktopModal] Rendering', { isOpen, hasHeader: !!header, hasChildren: !!children });

  if (!isOpen) {
    console.log('[DesktopModal] Not open, returning null');
    return null;
  }

  console.log('[DesktopModal] Creating portal');
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 bg-card/95 tech-card rounded-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-h-[200px]',
          className
        )}
      >
        {header ?? <SheetHeader title={title} description={description} onClose={onClose} indicatorColor={indicatorColor} />}
        {children}
        {footer}
      </div>
    </div>,
    document.body
  );
}

function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  description,
  className: _className,
  zIndex = 50,
  indicatorColor = 'bg-primary',
  header,
  footer,
}: SheetProps) {
  console.log('[MobileDrawer] Rendering', { isOpen, hasHeader: !!header, hasChildren: !!children });

  const defaultHeader = (
    <div className="flex items-center justify-between px-6 pb-4 border-b border-border/50 shrink-0">
      <div>
        {title && (
          <Drawer.Title className="flex items-center gap-3 mb-1">
            <div className={cn('w-2.5 h-2.5 animate-pulse', indicatorColor)} />
            <span className="font-mono text-base tracking-widest text-muted-foreground uppercase">
              {title}
            </span>
          </Drawer.Title>
        )}
        {description && (
          <Drawer.Description className="font-mono text-sm text-muted-foreground/60">
            {description}
          </Drawer.Description>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
      >
        <CloseCircle weight="BoldDuotone" size={24} />
      </button>
    </div>
  );

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} handleOnly>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          style={{ zIndex }}
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 w-full bg-card/95 backdrop-blur-md rounded-t-2xl flex flex-col h-[95dvh] max-h-[96vh] outline-none"
          style={{ zIndex: zIndex + 1 }}
          onOpenAutoFocus={(e) => console.log('[Drawer.Content] onOpenAutoFocus', e)}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-3 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header - always include Drawer.Title for accessibility */}
          {header ? (
            <>
              <Drawer.Title className="sr-only">Dialog</Drawer.Title>
              <Drawer.Description className="sr-only">Dialog content</Drawer.Description>
              {header}
            </>
          ) : defaultHeader}

          {/* Content */}
          {children}

          {/* Footer */}
          {footer && (
            <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
              {footer}
            </div>
          )}

          {/* Safe area padding when no footer */}
          {!footer && <div className="pb-[env(safe-area-inset-bottom)]" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function Sheet(props: SheetProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  console.log('[Sheet] Rendering', {
    isOpen: props.isOpen,
    isDesktop,
    hasHeader: !!props.header,
    hasChildren: !!props.children,
    className: props.className,
  });

  if (isDesktop) {
    console.log('[Sheet] Using DesktopModal');
    return <DesktopModal {...props} />;
  }

  console.log('[Sheet] Using MobileDrawer');
  return <MobileDrawer {...props} />;
}
