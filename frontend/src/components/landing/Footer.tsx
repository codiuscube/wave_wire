import { Waves } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-zinc-950 text-muted-foreground text-sm">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4" />
          <span className="font-bold text-foreground tracking-tight uppercase">
            Home Break
          </span>
        </div>

        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
        </div>

        <p>&copy; 2025 Home Break. Built with love for the ocean.</p>
      </div>
    </footer>
  );
}
