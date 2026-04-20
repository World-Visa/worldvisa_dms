import { MAX_FILE_SIZE_BYTES } from "@/lib/documents/uploadLimits";

const FORMAT_MAP = {
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    label: 'PDF',
  },
  jpg: {
    extensions: ['.jpg', '.jpeg'],
    mimeTypes: ['image/jpeg', 'image/jpg'],
    label: 'JPG/JPEG',
  },
  png: {
    extensions: ['.png'],
    mimeTypes: ['image/png'],
    label: 'PNG',
  },
  docx: {
    extensions: ['.doc', '.docx'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    label: 'Word (.doc/.docx)',
  },
  other: {
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    label: 'Text (.txt)',
  },
} as const satisfies Record<string, { extensions: string[]; mimeTypes: string[]; label: string }>;

const FALLBACK_FORMATS: (keyof typeof FORMAT_MAP)[] = ['pdf', 'jpg', 'png', 'docx', 'other'];

export interface ResolvedFileFormats {
  acceptAttribute: string;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  hintText: string;
  allowedTypesLabel: string;
}

export function resolveFileFormats(formats: string[] | undefined): ResolvedFileFormats {
  const active = (formats?.length ? formats : FALLBACK_FORMATS).filter(
    (f): f is keyof typeof FORMAT_MAP => f in FORMAT_MAP,
  );

  const extensions = active.flatMap((f) => FORMAT_MAP[f].extensions);
  const mimeTypes = active.flatMap((f) => FORMAT_MAP[f].mimeTypes);
  const labels = active.map((f) => FORMAT_MAP[f].label);
  const allowedTypesLabel = labels.join(", ");

  return {
    acceptAttribute: [...extensions, ...mimeTypes].join(","),
    allowedExtensions: extensions,
    allowedMimeTypes: mimeTypes,
    hintText: `${allowedTypesLabel} · Max 5 MB per file`,
    allowedTypesLabel,
  };
}

export function isIdentityPhotographDocument(
  document_category: string,
  document_name: string,
): boolean {
  const name = document_name.toLowerCase();
  return (
    (document_category === "Identity Documents" || document_category === "Identity") &&
    (name.includes("photograph") || name.includes("photo") || name.includes("picture"))
  );
}

export type ResolvedUploadFormats = {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  unsupportedTypeMessage: (fileName: string) => string;
};

/** Rules for pre-request upload validation (checklist formats + identity-photo exception). */
export function getResolvedUploadFormats(
  document_category: string,
  document_name: string,
  templateFormats: string[] | undefined,
): ResolvedUploadFormats {
  if (isIdentityPhotographDocument(document_category, document_name)) {
    return {
      allowedExtensions: [".jpg", ".jpeg"],
      allowedMimeTypes: ["image/jpeg", "image/jpg"],
      unsupportedTypeMessage: (fileName) =>
        `File "${fileName}" has an unsupported file type. Only JPG and JPEG files are allowed for photographs.`,
    };
  }

  const { allowedExtensions, allowedMimeTypes, allowedTypesLabel } =
    resolveFileFormats(templateFormats);
  return {
    allowedExtensions,
    allowedMimeTypes,
    unsupportedTypeMessage: (fileName) =>
      `File "${fileName}" has an unsupported file type. Allowed: ${allowedTypesLabel}.`,
  };
}

/** Client-side validation before POST/PATCH document upload; throws Error with user-facing message. */
export function assertUploadFileValid(
  file: File,
  document_category: string,
  document_name: string,
  templateFormats: string[] | undefined,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES,
): void {
  if (file.size === 0) {
    throw new Error(`File "${file.name}" is empty. Please select a valid file.`);
  }
  if (file.size > maxSizeBytes) {
    throw new Error(`File "${file.name}" is too large. Maximum file size is 5MB.`);
  }

  const { allowedExtensions, allowedMimeTypes, unsupportedTypeMessage } =
    getResolvedUploadFormats(document_category, document_name, templateFormats);

  const lower = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some((ext) => lower.endsWith(ext));
  if (!hasValidExtension) {
    throw new Error(unsupportedTypeMessage(file.name));
  }
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(unsupportedTypeMessage(file.name));
  }
}


export function isFileValid(
  file: File,
  allowedExtensions: string[],
  allowedMimeTypes: string[],
  maxSizeBytes: number,
): boolean {
  if (file.size === 0 || file.size > maxSizeBytes) return false;
  const lower = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some((ext) => lower.endsWith(ext));
  return hasValidExtension && allowedMimeTypes.includes(file.type);
}
