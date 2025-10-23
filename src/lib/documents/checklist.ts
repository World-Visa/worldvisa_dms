export const IDENTITY_DOCUMENTS = [
  { "category": "Identity Documents", "documentType": "Passport", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Aadhar Card", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Pan Card", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Driving license", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Photograph", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Marriage/ Divorce certificate", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Work Permit (Overseas client)", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "National Identity Document", "allowedDocument": 1 },
  { "category": "Identity Documents", "documentType": "Name Change Affidavit", "allowedDocument": 1 }
];

export const EDUCATION_DOCUMENTS = [
  { "category": "Education Documents", "documentType": "10th", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "12th", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "Diploma Certificate", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "Diploma MarkSheet", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "Bachelors Degree Certificate", "allowedDocument": 1 },
  { 
    "category": "Education Documents", 
    "documentType": "Bachelors Marksheet/ Transcripts", 
    "allowedDocument": 1,
    "instruction": "combine all marksheets as one pdf and upload here make sure pdf size is below 5mb"
  },
  { "category": "Education Documents", "documentType": "Masters Degree Certificate", "allowedDocument": 1 },
  { 
    "category": "Education Documents", 
    "documentType": "Masters Marksheet/ Transcripts", 
    "allowedDocument": 1,
    "instruction": "combine all marksheets as one pdf and upload here make sure pdf size is below 5mb"
  },
  { "category": "Education Documents", "documentType": "PHD Degree Certificate", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "PHD (Grade Sheet)", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "Education sheet", "allowedDocument": 1 },
  { "category": "Education Documents", "documentType": "Provisional Degree Certificate (Engineers Australia)", "allowedDocument": 1 }
];

export const OTHER_DOCUMENTS = [
  { "category": "Other Documents", "documentType": "Updated Resume", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "RPL (Only for ACS)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "CDR (Only for Engineers Australia)", "allowedDocument": 6 },
  { "category": "Other Documents", "documentType": "Project list (only for Vetassess)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Portfolio (only for Vetassess)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "English langugae test", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Syllabus for CPA", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Registration/ License", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Photographs and Video (Only for TRA/ VET)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Publications List (only for Vetassess)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Supervised Teaching Practice (AITSL)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Org chart (only for Vetassess)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "ACS Skill Select Sheet (Only for ACS)", "allowedDocument": 1 },
  { "category": "Other Documents", "documentType": "Other Certification", "allowedDocument": 1 },
];

export const COMPANY_DOCUMENTS = [
  { "category": "Company", "documentType": "Offer Letter/ Appointment Letter", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Releaving Letter/ Experience/ Service certificate", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Promotion Letters", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Reference Letter", "sampleDocument": "/sample_documents/Reference letter format.docx", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Statutory Decleration", "sampleDocument": "/sample_documents/Stat Dec sample.docx", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Payslips" },
  { "category": "Company", "documentType": "Bank Statement" },
  { "category": "Company", "documentType": "Taxation (Form 16/26 AS)", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Superannuation (EPFO Statement)" },
  { "category": "Company", "documentType": "Salary Certifcate (only VET/ TRA/EA)", "allowedDocument": 1 },
  { "category": "Company", "documentType": "Employer Linked Insurance", "allowedDocument": 1 }
];

export const SELF_EMPLOYMENT_DOCUMENTS = [
  { "category": "Self Employment/Freelance", "documentType": "Company registration" },
  { "category": "Self Employment/Freelance", "documentType": "Reference Letter/ Statutory Declaration" },
  { "category": "Self Employment/Freelance", "documentType": "Client Invoices" },
  { "category": "Self Employment/Freelance", "documentType": "Company Bank Statement" },
  { "category": "Self Employment/Freelance", "documentType": "Taxation Records (showing clients name)" },
  { "category": "Self Employment/Freelance", "documentType": "Contracts with clients" },
  { "category": "Self Employment/Freelance", "documentType": "Reference letters from Clients (Endorsement letter)" },
  { "category": "Self Employment/Freelance", "documentType": "Letter from Accountant (CA)" },
  { "category": "Self Employment/Freelance", "documentType": "Organisational Chart" }
];
