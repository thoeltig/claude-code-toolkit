"""Transcript deduplication package for smart-compact plugin."""

# Models and configuration
from cleanup.const_models_and_config import (
    ContentType,
    FileOperation,
    BashOperation,
    GrepOperation,
    EditOperation,
    DedupAction,
    Logger,
    PARTIAL_DEDUP_MARKER,
    DUPLICATE_READ_MARKER,
    DUPLICATE_SCRIPT_MARKER,
    get_duplicate_bytes_and_token_estimate,
    get_min_dedup_bytes,
    get_multiline_context_lines,
    get_singleline_context_chars,
    get_cache_duration_minutes,
    get_context_window_tokens,
    get_cache_validator_threshold,
    get_notification_threshold,
)

# Content operations
from cleanup.content import (
    detect_content_type,
    find_line_differences,
    apply_context_margin,
    create_partial_dedup_multiline,
    create_partial_dedup_singleline,
    find_character_diff,
)

# Detection utilities
from cleanup.detection import (
    extract_line_numbers_from_grep,
    edit_overlaps_with_lines,
    extract_filepath_from_bash_command,
    is_script_invocation,
)

# Extraction and I/O
from cleanup.extract import (
    load_transcript,
    save_transcript,
    extract_operations,
    extract_bash_operations,
    extract_grep_operations,
    extract_edit_operations,
)

__all__ = [
    # Models
    "ContentType",
    "FileOperation",
    "BashOperation",
    "GrepOperation",
    "EditOperation",
    "DedupAction",
    "Logger",
    # Markers
    "PARTIAL_DEDUP_MARKER",
    "DUPLICATE_READ_MARKER",
    "DUPLICATE_SCRIPT_MARKER",
    # Get estimate
    "get_duplicate_bytes_and_token_estimate"
    # Config
    "get_min_dedup_bytes",
    "get_multiline_context_lines",
    "get_singleline_context_chars",
    "get_cache_duration_minutes",
    "get_context_window_tokens",
    "get_cache_validator_threshold",
    "get_notification_threshold",
    # Content operations
    "detect_content_type",
    "find_line_differences",
    "apply_context_margin",
    "create_partial_dedup_multiline",
    "create_partial_dedup_singleline",
    "find_character_diff",
    # Detection
    "extract_line_numbers_from_grep",
    "edit_overlaps_with_lines",
    "extract_filepath_from_bash_command",
    "is_script_invocation",
    # I/O and extraction
    "load_transcript",
    "save_transcript",
    "extract_operations",
    "extract_bash_operations",
    "extract_grep_operations",
    "extract_edit_operations",
]
