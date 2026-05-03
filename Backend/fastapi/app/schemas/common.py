from typing import Any


def _normalize_aadhaar(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Invalid Aadhaar format")
    digits = ''.join(ch for ch in value if ch.isdigit())
    if len(digits) != 12:
        raise ValueError("Aadhaar must have 12 digits")
    if digits[0] in ('0', '1'):
        raise ValueError("Aadhaar must start with 2-9")
    return f"{digits[0:4]} {digits[4:8]} {digits[8:12]}"


def _normalize_phone(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Invalid phone format")
    digits = ''.join(ch for ch in value if ch.isdigit())
    if len(digits) > 10:
        digits = digits[-10:]
    if len(digits) != 10:
        raise ValueError("Phone must be 10 digits")
    if digits[0] not in ('6', '7', '8', '9'):
        raise ValueError("Phone must start with 6, 7, 8, or 9")
    return digits
