/**
 * Maps the 5 FORMAT_OPTIONS values (as stored in ChecklistDocumentTemplate.format)
 * to their browser accept attribute, validation arrays, and human-readable labels.
 *
 * Values: 'pdf' | 'jpg' | 'png' | 'docx' | 'other'
 */

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

/** Fallback when no template format is set — accept all supported types */
const FALLBACK_FORMATS: (keyof typeof FORMAT_MAP)[] = ['pdf', 'jpg', 'png', 'docx', 'other'];

export interface ResolvedFileFormats {
  /** Value for <input accept="..."> */
  acceptAttribute: string;
  /** Lowercase file extensions for extension-based validation */
  allowedExtensions: string[];
  /** MIME types for MIME-based validation */
  allowedMimeTypes: string[];
  /** Short human-readable string shown below the upload zone */
  hintText: string;
}

/**
 * Resolves dynamic file format constraints from a template's `format` field.
 * Falls back to all supported formats when the field is empty or absent.
 */
export function resolveFileFormats(formats: string[] | undefined): ResolvedFileFormats {
  const active = (formats?.length ? formats : FALLBACK_FORMATS).filter(
    (f): f is keyof typeof FORMAT_MAP => f in FORMAT_MAP,
  );

  const extensions = active.flatMap((f) => FORMAT_MAP[f].extensions);
  const mimeTypes = active.flatMap((f) => FORMAT_MAP[f].mimeTypes);
  const labels = active.map((f) => FORMAT_MAP[f].label);

  return {
    acceptAttribute: [...extensions, ...mimeTypes].join(','),
    allowedExtensions: extensions,
    allowedMimeTypes: mimeTypes,
    hintText: `${labels.join(', ')} · Max 5 MB per file`,
  };
}

/**
 * Silently checks whether a file passes extension + MIME + size rules.
 * Returns true/false without showing any toast — callers handle user feedback.
 */
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
