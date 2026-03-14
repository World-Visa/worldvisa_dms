interface FileTypeIconProps {
  contentType?: string;
  className?: string;
}

type FileCategory =
  | "pdf"
  | "image"
  | "word"
  | "excel"
  | "powerpoint"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "generic";

function getCategory(contentType?: string): FileCategory {
  if (!contentType) return "generic";
  const ct = contentType.toLowerCase();
  if (ct === "application/pdf") return "pdf";
  if (ct.startsWith("image/")) return "image";
  if (
    ct === "application/msword" ||
    ct.includes("wordprocessingml") ||
    ct === "application/vnd.oasis.opendocument.text"
  )
    return "word";
  if (
    ct === "application/vnd.ms-excel" ||
    ct.includes("spreadsheetml") ||
    ct === "application/vnd.oasis.opendocument.spreadsheet"
  )
    return "excel";
  if (
    ct === "application/vnd.ms-powerpoint" ||
    ct.includes("presentationml") ||
    ct === "application/vnd.oasis.opendocument.presentation"
  )
    return "powerpoint";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  if (
    ct === "application/zip" ||
    ct === "application/x-zip-compressed" ||
    ct === "application/x-tar" ||
    ct === "application/gzip" ||
    ct === "application/x-7z-compressed" ||
    ct === "application/x-rar-compressed" ||
    ct.includes("compressed")
  )
    return "archive";
  if (
    ct.startsWith("text/") ||
    ct === "application/json" ||
    ct === "application/xml" ||
    ct === "application/javascript" ||
    ct === "application/typescript"
  )
    return "code";
  return "generic";
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#E34234" fillOpacity="0.12" />
      <path
        d="M9 8C9 7.44772 9.44772 7 10 7H19L23 11V24C23 24.5523 22.5523 25 22 25H10C9.44772 25 9 24.5523 9 24V8Z"
        fill="#E34234"
        fillOpacity="0.18"
      />
      <path
        d="M19 7L23 11H19V7Z"
        fill="#E34234"
        fillOpacity="0.4"
      />
      <path
        d="M19 7V11H23"
        stroke="#E34234"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7H19L23 11V25H9V7Z"
        stroke="#E34234"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="#E34234"
        letterSpacing="0.3"
      >
        PDF
      </text>
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#34C759" fillOpacity="0.12" />
      <rect x="8" y="9" width="16" height="14" rx="2" stroke="#34C759" strokeWidth="1.25" />
      <circle cx="12.5" cy="13.5" r="1.5" fill="#34C759" />
      <path
        d="M8.5 20L12 16L14.5 18.5L18 14L23.5 20"
        stroke="#34C759"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WordIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2B579A" fillOpacity="0.12" />
      <path
        d="M9 8C9 7.44772 9.44772 7 10 7H19L23 11V24C23 24.5523 22.5523 25 22 25H10C9.44772 25 9 24.5523 9 24V8Z"
        fill="#2B579A"
        fillOpacity="0.15"
        stroke="#2B579A"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 7V11H23"
        stroke="#2B579A"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="#2B579A"
        letterSpacing="0.3"
      >
        DOC
      </text>
    </svg>
  );
}

function ExcelIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#217346" fillOpacity="0.12" />
      <path
        d="M9 8C9 7.44772 9.44772 7 10 7H19L23 11V24C23 24.5523 22.5523 25 22 25H10C9.44772 25 9 24.5523 9 24V8Z"
        fill="#217346"
        fillOpacity="0.15"
        stroke="#217346"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 7V11H23"
        stroke="#217346"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15L14.5 19M17 15L14.5 19M12 15H17M12 19H17"
        stroke="#217346"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PowerPointIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#D24726" fillOpacity="0.12" />
      <path
        d="M9 8C9 7.44772 9.44772 7 10 7H19L23 11V24C23 24.5523 22.5523 25 22 25H10C9.44772 25 9 24.5523 9 24V8Z"
        fill="#D24726"
        fillOpacity="0.15"
        stroke="#D24726"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 7V11H23"
        stroke="#D24726"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="#D24726"
        letterSpacing="0.3"
      >
        PPT
      </text>
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#AF52DE" fillOpacity="0.12" />
      <rect x="8" y="11" width="12" height="10" rx="2" stroke="#AF52DE" strokeWidth="1.25" />
      <path
        d="M20 14L24 12V20L20 18"
        stroke="#AF52DE"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 16L14.5 14.5V17.5L12 16Z"
        fill="#AF52DE"
      />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FF2D55" fillOpacity="0.12" />
      <path
        d="M13 20V12L21 10V18"
        stroke="#FF2D55"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="20" r="2" stroke="#FF2D55" strokeWidth="1.25" />
      <circle cx="19" cy="18" r="2" stroke="#FF2D55" strokeWidth="1.25" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FF9500" fillOpacity="0.12" />
      <rect x="8" y="8" width="16" height="4" rx="1.5" stroke="#FF9500" strokeWidth="1.25" />
      <path
        d="M9.5 12V23C9.5 23.5523 9.94772 24 10.5 24H21.5C22.0523 24 22.5 23.5523 22.5 23V12"
        stroke="#FF9500"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M14 16H18"
        stroke="#FF9500"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M14 10H18"
        stroke="#FF9500"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#6E6E73" fillOpacity="0.12" />
      <path
        d="M13 13L9 16L13 19"
        stroke="#6E6E73"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 13L23 16L19 19"
        stroke="#6E6E73"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 11L15 21"
        stroke="#6E6E73"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GenericIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#8E8E93" fillOpacity="0.12" />
      <path
        d="M9 8C9 7.44772 9.44772 7 10 7H19L23 11V24C23 24.5523 22.5523 25 22 25H10C9.44772 25 9 24.5523 9 24V8Z"
        stroke="#8E8E93"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 7V11H23"
        stroke="#8E8E93"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 16H20" stroke="#8E8E93" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M12 19H17" stroke="#8E8E93" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

const ICON_MAP: Record<FileCategory, () => React.ReactElement> = {
  pdf: PdfIcon,
  image: ImageIcon,
  word: WordIcon,
  excel: ExcelIcon,
  powerpoint: PowerPointIcon,
  video: VideoIcon,
  audio: AudioIcon,
  archive: ArchiveIcon,
  code: CodeIcon,
  generic: GenericIcon,
};

export function FileTypeIcon({ contentType, className }: FileTypeIconProps) {
  const category = getCategory(contentType);
  const Icon = ICON_MAP[category];
  return (
    <span className={className} style={{ display: "inline-flex", flexShrink: 0 }}>
      <Icon />
    </span>
  );
}

export function getFileTypeLabel(contentType?: string): string {
  const category = getCategory(contentType);
  const labels: Record<FileCategory, string> = {
    pdf: "PDF",
    image: "Image",
    word: "Word Doc",
    excel: "Spreadsheet",
    powerpoint: "Presentation",
    video: "Video",
    audio: "Audio",
    archive: "Archive",
    code: "Text / Code",
    generic: "File",
  };
  return labels[category];
}
