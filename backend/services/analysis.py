"""Claude API call via anthropic SDK, JSON parsing, and caching."""

import base64
import json
import re
import sqlite3

import anthropic

from backend.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, CLAUDE_MAX_TOKENS
from backend.prompts import build_system_prompt, build_user_content


def run_analysis(conn: sqlite3.Connection, case_id: int) -> dict:
    """Run Claude analysis for a case. Returns dict with status, json, cached flag."""
    row = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not row:
        raise ValueError(f"Case {case_id} not found")

    # Return cached result
    if row["analysis_status"] == "completed" and row["analysis_json"]:
        return {
            "id": case_id,
            "analysis_status": "completed",
            "analysis_json": json.loads(row["analysis_json"]),
            "analysis_error": None,
            "cached": True,
        }

    # Mark as processing
    conn.execute(
        "UPDATE cases SET analysis_status = 'processing' WHERE id = ?",
        (case_id,),
    )
    conn.commit()

    try:
        has_bid = bool(row["has_bid"])

        # Read file and encode to base64
        with open(row["settlement_path"], "rb") as f:
            b1 = base64.standard_b64encode(f.read()).decode("ascii")

        b2 = None
        if has_bid and row["bid_path"]:
            with open(row["bid_path"], "rb") as f:
                b2 = base64.standard_b64encode(f.read()).decode("ascii")

        system_prompt = build_system_prompt(has_bid)
        user_content = build_user_content(
            has_bid,
            b1=b1,
            media_type1=row["settlement_media_type"],
            b2=b2,
            media_type2=row["bid_media_type"],
        )

        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=CLAUDE_MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )

        # Extract text from response
        text = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )

        # Parse JSON from response
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise ValueError("Could not parse JSON from AI response")

        analysis = json.loads(match.group(0))
        analysis_json_str = json.dumps(analysis)

        # Denormalize key fields for listing
        conn.execute(
            """UPDATE cases SET
                analysis_json = ?,
                analysis_status = 'completed',
                analysis_error = NULL,
                case_name = ?,
                case_number = ?,
                jurisdiction = ?,
                settlement_type = ?
            WHERE id = ?""",
            (
                analysis_json_str,
                analysis.get("case_name"),
                analysis.get("case_number"),
                analysis.get("jurisdiction"),
                analysis.get("settlement_type"),
                case_id,
            ),
        )
        conn.commit()

        return {
            "id": case_id,
            "analysis_status": "completed",
            "analysis_json": analysis,
            "analysis_error": None,
            "cached": False,
        }

    except Exception as e:
        conn.execute(
            "UPDATE cases SET analysis_status = 'failed', analysis_error = ? WHERE id = ?",
            (str(e), case_id),
        )
        conn.commit()
        return {
            "id": case_id,
            "analysis_status": "failed",
            "analysis_json": None,
            "analysis_error": str(e),
            "cached": False,
        }
