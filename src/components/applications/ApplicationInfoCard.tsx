"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { RiMessage3Fill } from "react-icons/ri";
import { CopyButton } from "@/components/ui/primitives/copy-button";
import { formatDate } from "@/utils/format";
import { PhoneInfoField } from "@/components/applications/PhoneInfoField";
import type { Application } from "@/types/applications";
import Image from "next/image";

// ─── Spring configs (identical to QCActionCard) ───────────
const SPRING = { type: "spring" as const, stiffness: 240, damping: 22 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 200, damping: 24 };

const FF: React.CSSProperties = { fontFeatureSettings: "'ss11', 'calt' 0" };

// ─── InfoField ────────────────────────────────────────────
function InfoField({ label, value }: { label: string; value: string }) {
  const isProvided = value !== "Not provided";
  return (
    <div>
      <p
        style={{
          ...FF,
          fontSize: 11,
          color: "#a3a3a3",
          fontWeight: 500,
          marginBottom: 2,
          lineHeight: "16px",
        }}
      >
        {label}
      </p>
      <div className="group flex items-center gap-0.5 min-w-0">
        <p
          style={{
            ...FF,
            fontSize: 13,
            fontWeight: 500,
            color: "#171717",
            lineHeight: "20px",
            letterSpacing: "-0.078px",
          }}
          className="truncate min-w-0 flex-1 select-none"
          title={isProvided ? value : undefined}
        >
          {value}
        </p>
        {isProvided && (
          <CopyButton
            valueToCopy={value}
            size="2xs"
            className="shrink-0 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5"
            aria-label={`Copy ${label}`}
          />
        )}
      </div>
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...FF,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#a3a3a3",
        paddingBottom: 8,
        borderBottom: "1px solid #efefef",
      }}
    >
      {children}
    </p>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function formatValue(value: string) {
  if (!value || value === "N/A") return "Not provided";
  return value;
}

// ─── Props ───────────────────────────────────────────────
export interface ApplicationInfoCardProps {
  application: Application;
  isSpouseApplication: boolean;
  user?: { role?: string } | null;
  onEmailLastComm?: () => void;
  onChatLastComm?: () => void;
  onCallLastComm?: () => void;
}

// ─── Main component ───────────────────────────────────────
export function ApplicationInfoCard({ application, isSpouseApplication, user, onEmailLastComm, onChatLastComm, onCallLastComm }: ApplicationInfoCardProps) {
  const reduced = useReducedMotion();

  const lastComm = (() => {
    const raw = application.last_communication_activity;
    if (!raw) return null;
    if (typeof raw === "string") return { date: raw, provider: null as null };
    return raw;
  })();

  return (
    // ── Outer gray container — exactly matches ApplicationDetailsHeader QC panel wrapper ──
    <motion.div
      className="flex flex-col w-full min-w-0 rounded-[24px]"
      style={{
        background: "#f7f7f7",
        gap: 6,
        paddingTop: 12,
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0 } }}
    >
      {/* ── Header row — identical to QCActionCard header ─────── */}
      <motion.div
        className="flex items-center justify-between shrink-0 w-full"
        style={{ paddingLeft: 10, paddingRight: 10 }}
        initial={{ opacity: 0, y: reduced ? 0 : 6 }}
        animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: 0.08 } }}
      >
        <p
          style={{
            ...FF,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: "20px",
            letterSpacing: "-0.078px",
            color: "#a3a3a3",
          }}
          className="select-none"
        >
          Application Information
        </p>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Package_Finalize — dark gradient pill (QCActionCard footer button style) */}
          {application.Record_Type !== "spouse_skill_assessment" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 999,
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
                  "linear-gradient(90deg, #171717 0%, #171717 100%)",

              }}
            >
              <BadgeCheck size={11} style={{ color: "white", flexShrink: 0 }} />
              <span
                style={{
                  ...FF,
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: "18px",
                  color: "white",
                  letterSpacing: "-0.066px",
                }}
              >
                {application.Package_Finalize ?? "Not provided"}
              </span>
            </span>
          )}

          {/* Application_Stage — soft emerald pill */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 10px",
              borderRadius: 999,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              ...FF,
            }}
          >
            <span
              style={{
                ...FF,
                fontSize: 11,
                fontWeight: 600,
                lineHeight: "18px",
                color: "#16a34a",
                letterSpacing: "-0.066px",
              }}
            >
              {application.Application_Stage}
            </span>
          </span>
        </div>
      </motion.div>

      {/* ── White card — identical shadow/radius to QCActionCard document card ── */}
      <motion.div
        className="relative flex flex-col shrink-0 w-full overflow-hidden"
        style={{
          borderRadius: "16px 16px 20px 20px",
          background: "white",
          boxShadow:
            "0px 4px 8px -2px rgba(51,51,51,0.06)," +
            "0px 2px 4px 0px rgba(51,51,51,0.04)," +
            "0px 1px 2px 0px rgba(51,51,51,0.04)," +
            "0px 0px 0px 1px #f5f5f5",
        }}
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.16 } }}
      >
        <div className="p-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">

            {/* Column 1 — Personal Information */}
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.22 } }}
            >
              <SectionLabel>Personal Information</SectionLabel>
              <InfoField label="Full Name" value={formatValue(application.Name)} />
              <InfoField label="Email" value={formatValue(application.Email)} />
              <PhoneInfoField label="Phone" value={formatValue(application.Phone)} reduced={Boolean(reduced)} />
              {isSpouseApplication ? (
                <InfoField
                  label="Main Applicant"
                  value={formatValue(application.Main_Applicant ?? "")}
                />
              ) : (
                <div>
                  <p
                    style={{
                      ...FF,
                      fontSize: 11,
                      color: "#a3a3a3",
                      fontWeight: 500,
                      marginBottom: 2,
                      lineHeight: "16px",
                    }}
                  >
                    Spouse Skill Assessment
                  </p>
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    {!application.Spouse_Skill_Assessment && !application.Spouse_Name ? (
                      <span
                        style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}
                        className="select-none"
                      >
                        Not provided
                      </span>
                    ) : (
                      <>
                        <span
                          style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717" }}
                          className="select-none"
                        >
                          {formatValue(application.Spouse_Skill_Assessment ?? "")}
                        </span>
                        <span style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#a3a3a3" }}>—</span>
                        {application.spouse_lead_id && (application.Spouse_Name ?? "").trim() !== "" ? (
                          <Link
                            href={`/v2/spouse-skill-assessment-applications/${application.spouse_lead_id}`}
                            style={{ ...FF, fontSize: 13, fontWeight: 500, lineHeight: "20px" }}
                            className="text-primary hover:underline truncate min-w-0"
                            aria-label={`View spouse application: ${application.Spouse_Name}`}
                          >
                            {formatValue(application.Spouse_Name ?? "")}
                          </Link>
                        ) : (
                          <span
                            style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717" }}
                            className="truncate min-w-0 select-none"
                          >
                            {formatValue(application.Spouse_Name ?? "")}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Column 2 — Visa Details */}
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.28 } }}
            >
              <SectionLabel>Visa Details</SectionLabel>
              <InfoField label="Target Country" value={formatValue(application.Qualified_Country ?? "")} />
              <div>
                <p
                  style={{
                    ...FF,
                    fontSize: 11,
                    color: "#a3a3a3",
                    fontWeight: 500,
                    marginBottom: 2,
                    lineHeight: "16px",
                  }}
                >
                  Service Type
                </p>
                <span
                  style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}
                  className="select-none"
                >
                  {formatValue(application.Service_Finalized ?? "")}
                </span>
              </div>
              <InfoField label="Suggested ANZSCO" value={formatValue(application.Suggested_Anzsco ?? "")} />
            </motion.div>

            {/* Column 3 — Application Mgmt */}
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.34 } }}
            >
              <SectionLabel>Application Mgmt</SectionLabel>
              <InfoField label="Handled By" value={formatValue(application.Application_Handled_By)} />
              <div>
                <p
                  style={{
                    ...FF,
                    fontSize: 11,
                    color: "#a3a3a3",
                    fontWeight: 500,
                    marginBottom: 2,
                    lineHeight: "16px",
                  }}
                >
                  Created Date
                </p>
                <p
                  style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}
                  className="select-none"
                >
                  {application.Created_Time
                    ? formatDate(application.Created_Time, "time")
                    : "Not available"}
                </p>
              </div>
              <InfoField label="Assessing Authority" value={formatValue(application.Assessing_Authority ?? "")} />
              {lastComm && (() => {
                const handleClick =
                  lastComm.provider === "email" ? onEmailLastComm
                  : lastComm.provider === "chat" ? onChatLastComm
                  : lastComm.provider === "call" ? onCallLastComm
                  : undefined;
                const content = (
                  <>
                    <p
                      style={{
                        ...FF,
                        fontSize: 11,
                        color: "#a3a3a3",
                        fontWeight: 500,
                        marginBottom: 2,
                        lineHeight: "16px",
                      }}
                    >
                      Last Communication
                    </p>
                    <div className="flex items-center gap-1.5">
                      {lastComm.provider === "email" && (
                        <Image src="/gmail-icon.svg" alt="Email" width={14} height={14} />
                      )}
                      {lastComm.provider === "chat" && (
                        <RiMessage3Fill className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {lastComm.provider === "call" && (
                        <Image src="/icons/call.png" alt="Softphone" width={14} height={14} />
                      )}
                      <p
                        style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}
                        className="select-none"
                      >
                        {formatDate(lastComm.date, "datetime")}
                      </p>
                    </div>
                  </>
                );
                return handleClick ? (
                  <button
                    type="button"
                    onClick={handleClick}
                    className="text-left cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 -my-1 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    {content}
                  </button>
                ) : (
                  <div>{content}</div>
                );
              })()}
            </motion.div>

            {/* Column 4 — Assets & Files */}
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.40 } }}
            >
              <SectionLabel>Assets & Files</SectionLabel>
              <InfoField label="Record Type" value={formatValue(application.Record_Type ?? "")} />
              <div>
                <p
                  style={{
                    ...FF,
                    fontSize: 11,
                    color: "#a3a3a3",
                    fontWeight: 500,
                    marginBottom: 2,
                    lineHeight: "16px",
                  }}
                >
                  Total Documents
                </p>
                <p
                  style={{ ...FF, fontSize: 13, fontWeight: 500, color: "#171717", lineHeight: "20px" }}
                  className="select-none"
                >
                  {application.AttachmentCount || 0} documents
                </p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Inner shadow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: "inherit",
            boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
