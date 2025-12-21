import { toast } from 'sonner';

export function showError(message: string) {
  toast.error(message);
}
