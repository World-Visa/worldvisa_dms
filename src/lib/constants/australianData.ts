// Australian visa subclasses and states data

export interface VisaSubclass {
   code: string;
   name: string;
   label: string; // Combined format: "189 - Skilled Independent"
}

export interface AustralianState {
   code: string;
   name: string;
}

// Australian Visa Subclasses
export const AUSTRALIAN_VISA_SUBCLASSES: VisaSubclass[] = [
   {
      code: "189",
      name: "Skilled Independent",
      label: "189 - Skilled Independent",
   },
   { code: "190", name: "Skilled Nominated", label: "190 - Skilled Nominated" },
   {
      code: "491",
      name: "Skilled Work Regional (Provisional)",
      label: "491 - Skilled Work Regional (Provisional)",
   },
   {
      code: "482",
      name: "Temporary Skill Shortage",
      label: "482 - Temporary Skill Shortage",
   },
   {
      code: "186",
      name: "Employer Nomination Scheme",
      label: "186 - Employer Nomination Scheme",
   },
   {
      code: "494",
      name: "Skilled Employer Sponsored Regional (Provisional)",
      label: "494 - Skilled Employer Sponsored Regional (Provisional)",
   },
   {
      code: "191",
      name: "Permanent Residence (Skilled Regional)",
      label: "191 - Permanent Residence (Skilled Regional)",
   },
   {
      code: "485",
      name: "Temporary Graduate",
      label: "485 - Temporary Graduate",
   },
   { code: "407", name: "Training", label: "407 - Training" },
   {
      code: "400",
      name: "Temporary Work (Short Stay Specialist)",
      label: "400 - Temporary Work (Short Stay Specialist)",
   },
   {
      code: "188",
      name: "Business Innovation and Investment (Provisional)",
      label: "188 - Business Innovation and Investment (Provisional)",
   },
   {
      code: "888",
      name: "Business Innovation and Investment (Permanent)",
      label: "888 - Business Innovation and Investment (Permanent)",
   },
   {
      code: "132",
      name: "Business Talent (Permanent)",
      label: "132 - Business Talent (Permanent)",
   },
   { code: "500", name: "Student", label: "500 - Student" },
   { code: "600", name: "Visitor", label: "600 - Visitor" },
   {
      code: "820",
      name: "Partner (Temporary)",
      label: "820 - Partner (Temporary)",
   },
   { code: "801", name: "Partner (Migrant)", label: "801 - Partner (Migrant)" },
   {
      code: "309",
      name: "Partner (Provisional)",
      label: "309 - Partner (Provisional)",
   },
   {
      code: "100",
      name: "Partner (Residence)",
      label: "100 - Partner (Residence)",
   },
   {
      code: "143",
      name: "Contributory Parent",
      label: "143 - Contributory Parent",
   },
   {
      code: "173",
      name: "Contributory Parent (Temporary)",
      label: "173 - Contributory Parent (Temporary)",
   },
   { code: "103", name: "Parent", label: "103 - Parent" },
   { code: "804", name: "Aged Parent", label: "804 - Aged Parent" },
   {
      code: "884",
      name: "Contributory Aged Parent (Temporary)",
      label: "884 - Contributory Aged Parent (Temporary)",
   },
   {
      code: "864",
      name: "Contributory Aged Parent",
      label: "864 - Contributory Aged Parent",
   },
];

// Australian States and Territories
export const AUSTRALIAN_STATES: AustralianState[] = [
   { code: "NSW", name: "New South Wales" },
   { code: "VIC", name: "Victoria" },
   { code: "QLD", name: "Queensland" },
   { code: "SA", name: "South Australia" },
   { code: "WA", name: "Western Australia" },
   { code: "TAS", name: "Tasmania" },
   { code: "NT", name: "Northern Territory" },
   { code: "ACT", name: "Australian Capital Territory" },
];

// Helper functions for searching and filtering

export function searchVisaSubclasses(query: string): VisaSubclass[] {
   if (!query) return AUSTRALIAN_VISA_SUBCLASSES;

   const lowerQuery = query.toLowerCase();
   return AUSTRALIAN_VISA_SUBCLASSES.filter(
      (subclass) =>
         subclass.code.toLowerCase().includes(lowerQuery) ||
         subclass.name.toLowerCase().includes(lowerQuery) ||
         subclass.label.toLowerCase().includes(lowerQuery)
   );
}

export function searchStates(query: string): AustralianState[] {
   if (!query) return AUSTRALIAN_STATES;

   const lowerQuery = query.toLowerCase();
   return AUSTRALIAN_STATES.filter(
      (state) =>
         state.code.toLowerCase().includes(lowerQuery) ||
         state.name.toLowerCase().includes(lowerQuery)
   );
}

export function getVisaSubclassByCode(code: string): VisaSubclass | undefined {
   return AUSTRALIAN_VISA_SUBCLASSES.find((s) => s.code === code);
}

export function getStateByCode(code: string): AustralianState | undefined {
   return AUSTRALIAN_STATES.find((s) => s.code === code);
}
