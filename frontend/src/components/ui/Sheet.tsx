import { Drawer } from 'vaul';
import { CloseCircle } from '@solar-icons/react';
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

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
  zIndex = 50,
  indicatorColor = 'bg-primary',
  header,
  footer,
}: SheetProps) {
  const defaultHeader = (
    <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
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
    <Drawer.Root direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-black/40"
          style={{ zIndex }}
        />
        <Drawer.Content
          className={cn(
            'right-2 top-2 bottom-2 fixed outline-none flex',
            'w-[calc(100%-1rem)] sm:w-[400px] lg:w-[500px]',
            className
          )}
          style={{
            zIndex: zIndex + 1,
            '--initial-transform': 'calc(100% + 8px)',
          } as React.CSSProperties}
        >
          <div className="bg-card h-full w-full grow flex flex-col rounded-2xl overflow-hidden shadow-2xl">
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
              <div className="shrink-0">
                {footer}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
