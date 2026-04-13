import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RiUser4Line } from 'react-icons/ri';
import { z } from 'zod';
import { Button } from '@/components/ui/primitives/button';
import { Form, FormRoot } from '@/components/ui/primitives/form';
import { Separator } from '@/components/ui/primitives/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetMain, SheetTitle } from '@/components/ui/primitives/sheet';
import { VisuallyHidden } from '@/components/ui/primitives/visually-hidden';
import TruncatedText from '@/components/ui/truncated-text';
import type { Application } from '@/types/applications';
import { useClientProfile, useUpdateClientProfile } from '@/hooks/useClientProfile';
import { EditLeadForm } from './form/edit-lead-form';
import { EditLeadFormSchema } from './form/schema';

interface EditProfileDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
}

export function EditProfileDetailsSheet({ open, onOpenChange, application }: EditProfileDetailsSheetProps) {
  const { data: profile } = useClientProfile(application.id, open);
  const updateProfile = useUpdateClientProfile(application.id);

  const form = useForm<z.infer<typeof EditLeadFormSchema>>({
    defaultValues: {
      leadId: application.id ?? '',
      fullName: application.Name ?? '',
      email: application.Email ?? '',
      phone: application.Phone ? `+91${application.Phone}` : '',
      assessingAuthority: application.Assessing_Authority ?? '',
      suggestedANZSCO: application.Suggested_Anzsco ?? '',
      serviceType: '',
      recordType: '',
      avatar: application.profile_image_url ?? '',
    },
    resolver: standardSchemaResolver(EditLeadFormSchema),
    shouldFocusError: false,
    mode: 'onBlur',
  });
  
  console.log(form.getValues());

  useEffect(() => {
    if (profile) {
      form.reset({
        leadId: profile.lead_id,
        fullName: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ? `+91${profile.phone}` : '',
        avatar: profile.profile_image_url ?? '',
        assessingAuthority: profile.assessing_authority ?? '',
        suggestedANZSCO: profile.suggested_anzsco ?? '',
        serviceType: profile.service_type ?? '',
        recordType: profile.record_type ?? '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: z.infer<typeof EditLeadFormSchema>) => {
    await updateProfile.mutateAsync({
      name: data.fullName || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      suggested_anzsco: data.suggestedANZSCO || undefined,
      assessing_authority: data.assessingAuthority || undefined,
      service_type: data.serviceType || undefined,
      record_type: data.recordType || undefined,
    });
    form.reset(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 flex flex-col gap-0">
        <SheetHeader className="p-0">
          <VisuallyHidden><SheetTitle>Edit Account Details</SheetTitle></VisuallyHidden>
          <header className="border-bg-soft flex h-12 w-full flex-row items-center gap-3 border-b p-3.5">
            <div className="flex flex-1 items-center gap-1 overflow-hidden text-sm font-medium">
              <RiUser4Line className="size-5 shrink-0 p-0.5" />
              <TruncatedText className="flex-1">Edit Account Details</TruncatedText>
            </div>
          </header>
        </SheetHeader>

        <SheetMain className="p-0 flex-1">
          <Form {...form}>
            <FormRoot
              id="edit-lead-form"
              autoComplete="off"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex h-full flex-col"
            >
              <EditLeadForm />
            </FormRoot>
          </Form>
        </SheetMain>

        <Separator />

        <SheetFooter className="p-0">
          <div className="flex w-full items-center justify-end p-3">
            <Button
              type="submit"
              variant="secondary"
              className="text-sm"
              form="edit-lead-form"
              disabled={!form.formState.isDirty || updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
