'use client';
import Settings from '@/components/v2/users/Settings';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const SettingsPage = () => {
    const router = useRouter();
    return (
        <>
            <div className="flex items-center gap-2 pt-2 pb-4">
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => router.back()}>
                    <ArrowLeftIcon className="size-3 text-muted-foreground" />
                </Button>
                <h1 className="text-xl font-semibold text-foreground">
                    Account Settings
                </h1>
            </div>
            <Settings />
        </>
    )
}

export default SettingsPage;