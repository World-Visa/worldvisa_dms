'use client';

import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { RiMailLine, RiCameraLine } from 'react-icons/ri';
import { z } from 'zod';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/primitives/avatar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/primitives/form';
import { Input } from '@/components/ui/primitives/input';
import { PhoneInput } from '@/components/ui/primitives/phone-input';
import { Separator } from '@/components/ui/primitives/separator';
import { EditLeadFormSchema } from '@/components/applications/form/schema';
import { CopyButton } from '@/components/ui/primitives/copy-button';
import { uploadClientProfileImage } from '@/lib/api/clientProfile';
import { showErrorToast, showSuccessToast } from '@/components/ui/primitives/sonner-helpers';

export const EditLeadForm = () => {
    const form = useFormContext<z.infer<typeof EditLeadFormSchema>>();
    const fullName = form.watch('fullName') ?? '';
    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const uploadProgress = useMotionValue(0);

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldOnChange: (value: string) => void,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const leadId = form.getValues('leadId');
        if (!leadId) return;

        const previewUrl = URL.createObjectURL(file);
        fieldOnChange(previewUrl);

        setIsUploading(true);
        uploadProgress.set(0);

        try {
            const newUrl = await uploadClientProfileImage(leadId, file, (p) => {
                uploadProgress.set(p);
            });
            fieldOnChange(newUrl);
            URL.revokeObjectURL(previewUrl);
            showSuccessToast('Profile image updated successfully');
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Failed to update profile image');
            fieldOnChange(form.getValues('avatar') ?? '');
            URL.revokeObjectURL(previewUrl);
        } finally {
            setIsUploading(false);
            uploadProgress.set(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="flex flex-col gap-6 p-5">
                {/* Avatar + Full Name */}
                <div className="flex items-center gap-3">
                    <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                            <FormItem className="shrink-0">
                                <FormControl>
                                    <div className="relative size-15">
                                        {/* Camera button */}
                                        <button
                                            type="button"
                                            disabled={isUploading}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group relative block size-full overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                                        >
                                            <Avatar className="size-full">
                                                <AvatarImage src={field.value || '/avatars/avatar.svg'} />
                                                <AvatarFallback>
                                                    {fullName ? (
                                                        initials || '?'
                                                    ) : (
                                                        <AvatarImage src="/avatars/avatar.svg" />
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Hover overlay */}
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45"
                                                initial={{ opacity: 0 }}
                                                whileHover={{ opacity: isUploading ? 0 : 1 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                            >
                                                <RiCameraLine className="size-5 text-white drop-shadow-md" />
                                            </motion.div>
                                        </button>

                                        {/* Progress ring — pointer-events-none so button stays clickable */}
                                        <AnimatePresence>
                                            {isUploading && (
                                                <motion.svg
                                                    viewBox="0 0 64 64"
                                                    className="pointer-events-none absolute inset-0 size-full -rotate-90"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {/* Track */}
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r="30"
                                                        fill="none"
                                                        stroke="#e5e7eb"
                                                        strokeWidth="3"
                                                    />
                                                    {/* Green progress fill */}
                                                    <motion.circle
                                                        cx="32"
                                                        cy="32"
                                                        r="30"
                                                        fill="none"
                                                        stroke="#22c55e"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        style={{ pathLength: uploadProgress }}
                                                    />
                                                </motion.svg>
                                            )}
                                        </AnimatePresence>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleFileChange(e, field.onChange)}
                                        />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field, fieldState }) => (
                            <FormItem className="flex-1 text-sm">
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="John Doe"
                                        id={field.name}
                                        value={field.value ?? ''}
                                        hasError={!!fieldState.error}
                                        size="xs"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                        <FormItem className="w-full text-sm">
                            <div className="flex items-center">
                                <FormLabel
                                    tooltip="Unique identifier for this lead in the system."
                                    className="gap-1"
                                >
                                    Lead Id
                                </FormLabel>
                            </div>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                size="xs"
                                className="bg-bg-weak cursor-default"
                                trailingNode={
                                    <CopyButton
                                        valueToCopy={field.value ?? ''}
                                        className="group-has-[input:focus]:border-l-stroke-strong"
                                    />
                                }
                                readOnly
                            />
                        </FormItem>
                    )}
                />

                <Separator />

                {/* Email + Phone */}
                <div className="grid w-full grid-cols-2 gap-2.5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="text-sm">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        type="email"
                                        placeholder="hello@example.com"
                                        id={field.name}
                                        value={field.value ?? ''}
                                        hasError={!!fieldState.error}
                                        leadingIcon={RiMailLine}
                                        size="xs"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem className="text-sm">
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <PhoneInput
                                        {...field}
                                        placeholder="Enter phone number"
                                        id={field.name}
                                        defaultCountry="IN"
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Assessing Authority + ANZSCO + Service Type + Record Type */}
                <div className="grid w-full grid-cols-2 gap-2.5">
                    <FormField
                        control={form.control}
                        name="assessingAuthority"
                        render={({ field, fieldState }) => (
                            <FormItem className="text-sm">
                                <FormLabel>Assessing Authority</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. Engineers Australia"
                                        id={field.name}
                                        value={field.value ?? ''}
                                        hasError={!!fieldState.error}
                                        size="xs"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="suggestedANZSCO"
                        render={({ field, fieldState }) => (
                            <FormItem className="text-sm">
                                <FormLabel>Suggested ANZSCO</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. 233211"
                                        id={field.name}
                                        value={field.value ?? ''}
                                        hasError={!!fieldState.error}
                                        size="xs"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field, fieldState }) => (
                            <FormItem className="text-sm">
                                <FormLabel>Service Type</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. Permanent Residency"
                                        id={field.name}
                                        value={field.value ?? ''}
                                        hasError={!!fieldState.error}
                                        size="xs"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="recordType"
                        render={({ field, fieldState }) => (
                            <FormItem className="text-sm">
                                <FormLabel>Record Type</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. visa_application"
                                        id={field.name}
                                        value={field.value ?? ''}
                                        hasError={!!fieldState.error}
                                        size="xs"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};
