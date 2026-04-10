export enum ApplicationStage {
  Stage1Approved = "Stage 1 Documentation: Approved",
  Stage1Rejected = "Stage 1 Documentation: Rejected",
  Stage1MilestoneCompleted = "Stage 1 Milestone Completed",
  Stage1DocumentationReviewed = "Stage 1 Documentation Reviewed",
  SkillAssessment = "Skill Assessment Stage",
  LanguageTest = "Language Test",
  LodgeApplication1 = "Lodge Application 1",
  LodgeApplication2 = "Lodge Application 2",
  LodgeApplication3 = "Lodge Application 3",
  LodgeApplication4 = "Lodge Application 4",
  InvitationToApplyUpper = "INIVITATION TO APPLY",
  InvitationToApply = "Invitation to Apply",
  InvitationToApply2 = "Invitation to Apply 2",
  VAApplicationLodge = "VA Application Lodge",
  Stage3Approved = "Stage 3 Documentation: Approved",
  Stage3VisaApplication = "Stage 3 Visa Application",
}

export enum ApplicationState {
  Active = "Active",
  InActive = "In-Active",
}

export enum DeadlineCategoryEnum {
  Approaching = "approaching",
  Overdue = "overdue",
  Future = "future",
  NoDeadline = "noDeadline",
}

export enum DocumentStatus {
  Pending = "pending",
  Approved = "approved",
  Reviewed = "reviewed",
  RequestReview = "request_review",
  Rejected = "rejected",
}

export enum StepTypeEnum {
  IN_APP = 'in_app',
  EMAIL = 'email',
  CALL = 'call',
  PUSH = 'push',
  CHAT = 'chat',
}