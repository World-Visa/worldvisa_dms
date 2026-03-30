'use client';
import { Button } from '@/components/ui/button'
import Settings from '@/components/v2/users/Settings';
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'


export default function AccountSettingsPage() {
    const router = useRouter();
    return (
        <div className="max-w-3xl mx-auto py-10">
            <div className="flex items-center gap-2 pt-2 pb-10">
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => router.back()}>
                    <ArrowLeftIcon className="size-3 text-muted-foreground" />
                </Button>
                <h1 className="text-xl font-semibold text-foreground">
                    Account Settings
                </h1>
            </div>
            <Settings />
        </div>
    )
}