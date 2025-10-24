import hashlib
import logging
from passlib.hash import bcrypt_sha256

try:
    import bcrypt as _bcrypt
    _HAVE_BCRYPT = True
except Exception:
    _bcrypt = None
    _HAVE_BCRYPT = False

# -------------------------------------------------------------------
# Runtime bcrypt sanity check (detects broken source installs)
# -------------------------------------------------------------------
_BCRYPT_OK = False
if _HAVE_BCRYPT:
    try:
        _test_digest = hashlib.sha256(b"test-password").digest()
        _test_h = _bcrypt.hashpw(_test_digest, _bcrypt.gensalt())
        if _bcrypt.checkpw(_test_digest, _test_h):
            _BCRYPT_OK = True
    except Exception:
        logging.exception("bcrypt module imported but self-test failed; treating as unavailable")
        _BCRYPT_OK = False


# -------------------------------------------------------------------
# Password Hashing
# -------------------------------------------------------------------
def hash_password(password: str) -> str:
    """
    Hash a plaintext password securely.

    If bcrypt backend works, compute sha256(password).digest() and bcrypt that.
    Otherwise fall back to Passlib's bcrypt_sha256.
    """
    if _BCRYPT_OK:
        try:
            digest = hashlib.sha256(password.encode("utf-8")).digest()
            hashed = _bcrypt.hashpw(digest, _bcrypt.gensalt())
            return hashed.decode("utf-8")
        except Exception as e:
            logging.warning(f"bcrypt.hashpw failed, falling back to passlib: {e}")

    # Fallback to passlib's bcrypt_sha256 (compatible format)
    return bcrypt_sha256.hash(password)


# -------------------------------------------------------------------
# Password Verification
# -------------------------------------------------------------------
def verify_password(plain: str, hashed: str) -> bool:
    """
    Verify a plaintext password against a stored hash.
    Supports both bcrypt_sha256 and raw bcrypt hashes.
    """

    # Case 1: hash from Passlib's bcrypt_sha256 (starts with $bcrypt-sha256$)
    if hashed.startswith("$bcrypt-sha256$"):
        try:
            return bcrypt_sha256.verify(plain, hashed)
        except Exception as e:
            logging.exception(f"bcrypt_sha256.verify failed: {e}")
            return False

    # Case 2: plain bcrypt hashes ($2a$, $2b$, etc.)
    if hashed.startswith("$2"):
        if not _BCRYPT_OK:
            raise RuntimeError(
                "Bcrypt backend unavailable or incompatible. "
                "Reinstall a proper 'bcrypt' wheel with: "
                "python -m pip install --upgrade --force-reinstall bcrypt"
            )
        try:
            digest = hashlib.sha256(plain.encode("utf-8")).digest()
            return _bcrypt.checkpw(digest, hashed.encode("utf-8"))
        except ValueError as e:
            msg = str(e)
            if "72 bytes" in msg or "cannot be longer" in msg:
                logging.warning("Password exceeds bcrypt 72-byte limit; attempting truncated verify")
                truncated = plain.encode("utf-8")[:72]
                return _bcrypt.checkpw(truncated, hashed.encode("utf-8"))
            logging.exception("bcrypt.checkpw failed unexpectedly")
            return False
        except Exception as e:
            logging.exception(f"bcrypt.checkpw error: {e}")
            return False

    # Unknown format
    logging.warning("Unrecognized hash format")
    return False
