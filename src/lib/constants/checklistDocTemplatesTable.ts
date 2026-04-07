export const CHECKLIST_DOC_TEMPLATE_COLUMNS = [
  {
    label: 'Document Type',
    headerClassName: 'min-w-[200px]',
    skeletonClassName: 'h-4 w-40',
  },
  {
    label: 'Format',
    headerClassName: 'min-w-[140px]',
    skeletonClassName: 'h-4 w-24',
  },
  {
    label: 'Allowed',
    headerClassName: 'w-[80px] text-center',
    skeletonClassName: 'h-4 w-8 mx-auto',
  },
  {
    label: 'State',
    headerClassName: 'w-[90px]',
    skeletonClassName: 'h-4 w-16',
  },
  {
    label: 'Actions',
    headerClassName: 'w-[90px] text-right',
    skeletonClassName: 'h-4 w-12 ml-auto',
  },
] as const;

export const FORMAT_OPTIONS = [
  { value: 'pdf',  label: 'PDF',  icon: '/icons/document-tree/pdf-icon.png' },
  { value: 'jpg',  label: 'JPG',  icon: '/icons/document-tree/image-icon.png' },
  { value: 'png',  label: 'PNG',  icon: '/icons/document-tree/image-icon.png' },
  { value: 'docx', label: 'DOCX', icon: '/icons/document-tree/docs-icon.png' },
  { value: 'other',label: 'Other',icon: '/icons/document-tree/docs-icon.png' },
] as const;

export const STATE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;
