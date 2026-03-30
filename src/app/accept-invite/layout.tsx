import { ReactNode } from 'react';

export default function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-auto bg-[url('/auth/background.svg')] bg-cover bg-no-repeat p-4 md:p-0">

      <div className="flex w-full flex-1 flex-row items-center justify-center">{children}</div>
    </div>
  );
}
