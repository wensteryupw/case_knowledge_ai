/**
 * Prompt definitions for Settlement Ops AI analysis.
 * Edit this file to enhance or modify the AI prompts.
 */

/**
 * JSON schema that defines the expected output structure.
 * Modify field names, types, or add new sections here.
 */
const OUTPUT_SCHEMA = {
  case_name: "string",
  case_number: "string",
  jurisdiction: "string",
  settlement_type: "Claims-Made|Direct Pay",
  summary: "string",
  timeline: {
    preliminary_approval: "date or [TBD]",
    notice_deadline: "string",
    exclusion_objection_deadline: "string",
    claims_deadline: "string",
    final_approval_hearing: "string",
    distribution_date: "string",
    milestones: [
      {
        label: "string",
        date: "string",
        t_minus: "T+0",
        status: "pending|upcoming|critical",
        owner: "string",
        notes: "string",
      },
    ],
  },
  class_specs: {
    estimated_size: "string",
    subclasses: "number",
    subclass_details: ["string"],
    data_format: "string",
    data_source: "string",
  },
  notice_plan: {
    channels: ["string"],
    skip_tracing: "required|not required|TBD",
    languages: ["string"],
    dedicated_url: "required|not required",
    toll_free_number: "required|not required",
  },
  fund_logistics: {
    gross_settlement: "string",
    admin_cap: "string",
    attorney_fees: "string",
    service_awards: "string",
    net_fund: "string",
    qsf_required: true,
    tax_id_setup: "string",
    payment_methods: ["string"],
  },
  claims_logic: {
    type: "string",
    form_required: true,
    required_fields: ["string"],
    proof_requirements: "string",
    claim_tiers: [
      {
        tier: "string",
        amount: "string",
        requirements: "string",
      },
    ],
    dispute_resolution: "string",
  },
  operational_checklist: {
    data_intake: [{ task: "string", details: "string", deadline_ref: "string" }],
    notice_phase: [{ task: "string", details: "string", deadline_ref: "string" }],
    claims_processing: [{ task: "string", details: "string", deadline_ref: "string" }],
    support: [{ task: "string", details: "string", deadline_ref: "string" }],
    payment: [{ task: "string", details: "string", deadline_ref: "string" }],
    reporting: [{ task: "string", details: "string", deadline_ref: "string" }],
  },
  conflict_audit: [
    {
      category: "string",
      settlement_says: "string",
      bid_says: "string",
      severity: "critical|warning|info",
      recommendation: "string",
    },
  ],
};

/**
 * Build the system prompt for the AI model.
 * @param {boolean} hasBid - Whether an Administrative Bid was uploaded
 * @returns {string} The system prompt
 */
export function buildSystemPrompt(hasBid) {
  const schemaStr = JSON.stringify(
    hasBid
      ? OUTPUT_SCHEMA
      : { ...OUTPUT_SCHEMA, conflict_audit: [] },
    null,
    0
  );

  return [
    `You are an expert Legal Operations and Class Action Project Manager.`,
    `You will receive a Settlement Agreement${hasBid ? " and an Administrative Bid" : ""}.`,
    `Analyze ${hasBid ? "and cross-reference them" : "the Settlement"} and respond ONLY with valid JSON (no markdown, no backticks) using this structure:`,
    schemaStr,
    `Use ONLY the provided documents.`,
    `Mark missing data as "[TBD - Post-Preliminary Approval]" or "[Not Specified]".`,
    `Use strict legal terminology.`,
    `Generate 15+ checklist items and 8+ milestones.`,
    hasBid ? "" : `Set "conflict_audit" to an empty array since no Bid was provided.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build the user message content array sent alongside uploaded documents.
 * @param {boolean} hasBid - Whether an Administrative Bid was uploaded
 * @param {{ b1: string, mediaType1: string, b2?: string, mediaType2?: string }} docs
 * @returns {Array} Content array for the messages API
 */
export function buildUserContent(hasBid, { b1, mediaType1, b2, mediaType2 }) {
  if (hasBid) {
    return [
      { type: "document", source: { type: "base64", media_type: mediaType1, data: b1 } },
      { type: "text", text: "DOCUMENT 1: Settlement Agreement." },
      { type: "document", source: { type: "base64", media_type: mediaType2, data: b2 } },
      { type: "text", text: "DOCUMENT 2: Administrative Bid/Proposal. Cross-reference both and produce JSON." },
    ];
  }

  return [
    { type: "document", source: { type: "base64", media_type: mediaType1, data: b1 } },
    { type: "text", text: "This is the Settlement Agreement. Analyze it and produce the JSON output. No Bid was provided, so leave conflict_audit as an empty array." },
  ];
}
