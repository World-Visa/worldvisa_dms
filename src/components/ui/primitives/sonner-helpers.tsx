import { ReactNode } from 'react';
import { ExternalToast, toast } from 'sonner';
import { Toast, ToastIcon, ToastProps } from '@/components/ui/sonner';

export const CONSISTENT_TOAST_OPTIONS: ExternalToast = {
  position: 'top-center',
};

export const showToast = ({
  options,
  children,
  ...toastProps
}: Omit<ToastProps, 'children'> & {
  options: ExternalToast;
  children: (args: { close: () => void }) => ReactNode;
}) => {
  return toast.custom((id) => <Toast {...toastProps}>{children({ close: () => toast.dismiss(id) })}</Toast>, {
    duration: 5000,
    unstyled: true,
    closeButton: false,
    ...CONSISTENT_TOAST_OPTIONS,
    ...options,
  });
};

export const showSuccessToast = (message: string, title?: string, options: ExternalToast = {}) => {
  showToast({
    title,
    children: () => (
      <>
        <ToastIcon variant="success" />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      ...CONSISTENT_TOAST_OPTIONS,
      ...options,
    },
  });
};

export const showErrorToast = (message: string | ReactNode, title?: string, options: ExternalToast = {}) => {
  showToast({
    title,
    children: () => (
      <>
        <ToastIcon variant="error" />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      ...CONSISTENT_TOAST_OPTIONS,
      ...options,
    },
  });
};

export const showWarningToast = (message: string | ReactNode, title?: string, options: ExternalToast = {}) => {
  showToast({
    title,
    children: () => (
      <>
        <ToastIcon variant="warning" />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      position: 'bottom-center',
      ...options,
    },
  });
};

export const showNotificationToast = (
  title: string,
  message: string,
  action?: { label: string; onClick: () => void },
  options: ExternalToast = {}
) => {
  showToast({
    variant: 'md',
    children: ({ close }) => (
      <>
        <ToastIcon variant="notification" />
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-foreground-600 text-xs">{message}</span>
          {action && (
            <button
              type="button"
              className="text-primary mt-1 text-left text-xs font-medium"
              onClick={() => {
                action.onClick();
                close();
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      </>
    ),
    options: {
      duration: 6000,
      ...CONSISTENT_TOAST_OPTIONS,
      ...options,
    },
  });
};
