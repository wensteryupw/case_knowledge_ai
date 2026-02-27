"""
Python port of prompts.js — prompt definitions for Settlement Ops AI analysis.
"""

import json

OUTPUT_SCHEMA = {
    "case_name": "string",
    "case_number": "string",
    "jurisdiction": "string",
    "settlement_type": "Claims-Made|Direct Pay",
    "summary": "string",
    "timeline": {
        "preliminary_approval": "date or [TBD]",
        "notice_deadline": "string",
        "exclusion_objection_deadline": "string",
        "claims_deadline": "string",
        "final_approval_hearing": "string",
        "distribution_date": "string",
        "milestones": [
            {
                "label": "string",
                "date": "string",
                "t_minus": "T+0",
                "status": "pending|upcoming|critical",
                "owner": "string",
                "notes": "string",
            }
        ],
    },
    "class_specs": {
        "estimated_size": "string",
        "subclasses": "number",
        "subclass_details": ["string"],
        "data_format": "string",
        "data_source": "string",
    },
    "notice_plan": {
        "channels": ["string"],
        "skip_tracing": "required|not required|TBD",
        "languages": ["string"],
        "dedicated_url": "required|not required",
        "toll_free_number": "required|not required",
    },
    "fund_logistics": {
        "gross_settlement": "string",
        "admin_cap": "string",
        "attorney_fees": "string",
        "service_awards": "string",
        "net_fund": "string",
        "qsf_required": True,
        "tax_id_setup": "string",
        "payment_methods": ["string"],
    },
    "claims_logic": {
        "type": "string",
        "form_required": True,
        "required_fields": ["string"],
        "proof_requirements": "string",
        "claim_tiers": [
            {
                "tier": "string",
                "amount": "string",
                "requirements": "string",
            }
        ],
        "dispute_resolution": "string",
    },
    "operational_checklist": {
        "data_intake": [{"task": "string", "details": "string", "deadline_ref": "string"}],
        "notice_phase": [{"task": "string", "details": "string", "deadline_ref": "string"}],
        "claims_processing": [{"task": "string", "details": "string", "deadline_ref": "string"}],
        "support": [{"task": "string", "details": "string", "deadline_ref": "string"}],
        "payment": [{"task": "string", "details": "string", "deadline_ref": "string"}],
        "reporting": [{"task": "string", "details": "string", "deadline_ref": "string"}],
    },
    "conflict_audit": [
        {
            "category": "string",
            "settlement_says": "string",
            "bid_says": "string",
            "severity": "critical|warning|info",
            "recommendation": "string",
        }
    ],
    "citations": {
        "<dotted.path.to.field>": [
            {
                "doc": "settlement|bid",
                "page": "integer, 1-indexed PDF page number",
                "quote": "string, verbatim 30-80 char excerpt from that page",
            }
        ],
    },
}


def build_system_prompt(has_bid: bool) -> str:
    schema = OUTPUT_SCHEMA if has_bid else {**OUTPUT_SCHEMA, "conflict_audit": []}
    schema_str = json.dumps(schema, separators=(",", ":"))

    parts = [
        "You are an expert Legal Operations and Class Action Project Manager.",
        f'You will receive a Settlement Agreement{" and an Administrative Bid" if has_bid else ""}.',
        f'Analyze {"and cross-reference them" if has_bid else "the Settlement"} and respond ONLY with valid JSON (no markdown, no backticks) using this structure:',
        schema_str,
        "Use ONLY the provided documents.",
        'Mark missing data as "[TBD - Post-Preliminary Approval]" or "[Not Specified]".',
        "Use strict legal terminology.",
        "Generate 15+ checklist items and 8+ milestones.",
        "For every factual data point you extract, record its source in the 'citations' object.",
        "The key is the dotted JSON path (e.g. 'fund_logistics.gross_settlement', 'timeline.milestones[0].date', 'timeline.preliminary_approval').",
        "Each value is an array of {doc, page, quote} objects.",
        "'doc' must be 'settlement' or 'bid'. 'page' is the 1-indexed PDF page number. 'quote' is a verbatim 30-80 character excerpt from that page.",
        "Include citations for: all dates, dollar amounts, deadlines, class specs, fund amounts, claim tier details, conflict audit quotes, checklist details, and milestone details.",
        "If a data point cannot be traced to a specific page, omit its citation entry.",
    ]
    if not has_bid:
        parts.append('Set "conflict_audit" to an empty array since no Bid was provided.')

    return "\n".join(parts)


def build_chat_system_prompt(analysis_json: dict, settlement_text: str, bid_text: str = None) -> str:
    """Build system prompt for the case chatbot, grounded in analysis + raw text."""
    analysis_str = json.dumps(analysis_json, indent=2)

    # Truncate raw text to 50K chars each to stay within context limits
    max_text = 50_000
    settlement_excerpt = (settlement_text or "")[:max_text]
    bid_excerpt = (bid_text or "")[:max_text] if bid_text else None

    parts = [
        "You are an expert legal operations assistant for class action settlement administration.",
        "Answer questions using ONLY the provided documents below. Be concise, use bullet points where helpful, and cite which document (Settlement or Bid) your information comes from.",
        "If the answer is not found in the provided documents, say so clearly — do not speculate.",
        "",
        "=== STRUCTURED ANALYSIS ===",
        analysis_str,
        "",
        "=== SETTLEMENT AGREEMENT TEXT ===",
        settlement_excerpt,
    ]

    if bid_excerpt:
        parts.append("")
        parts.append("=== ADMINISTRATIVE BID TEXT ===")
        parts.append(bid_excerpt)

    return "\n".join(parts)


def build_user_content(has_bid: bool, b1: str, media_type1: str,
                       b2: str = None, media_type2: str = None) -> list:
    if has_bid:
        return [
            {"type": "document", "source": {"type": "base64", "media_type": media_type1, "data": b1}},
            {"type": "text", "text": "DOCUMENT 1: Settlement Agreement."},
            {"type": "document", "source": {"type": "base64", "media_type": media_type2, "data": b2}},
            {"type": "text", "text": "DOCUMENT 2: Administrative Bid/Proposal. Cross-reference both and produce JSON."},
        ]

    return [
        {"type": "document", "source": {"type": "base64", "media_type": media_type1, "data": b1}},
        {"type": "text", "text": "This is the Settlement Agreement. Analyze it and produce the JSON output. No Bid was provided, so leave conflict_audit as an empty array."},
    ]
