import os
import time
import uuid
import hmac
import hashlib
import logging
import sqlite3
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timedelta, timezone
from pathlib import Path
import jwt

from app.config import (
    AUTH_DB_PATH,
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
)

logger = logging.getLogger("AuthService")

class UserAlreadyExistsException(Exception):
    def __init__(self, message: str = "This email is already registered. Please log in."):
        super().__init__(message)
        self.message = message

class UserNotFoundException(Exception):
    def __init__(self, message: str = "No account found with this email. Please register first."):
        super().__init__(message)
        self.message = message

class InvalidCredentialsException(Exception):
    def __init__(self, message: str = "Invalid password. Please check your credentials."):
        super().__init__(message)
        self.message = message

class TokenRevokedException(Exception):
    def __init__(self, message: str = "Token has been revoked/blacklisted. Please log in again."):
        super().__init__(message)
        self.message = message

class InvalidTokenException(Exception):
    def __init__(self, message: str = "Invalid or expired token."):
        super().__init__(message)
        self.message = message


class AuthService:
    """
    Manages user registration, login, password verification, 
    JWT tokens, and SQLite-backed Token Blacklisting.
    """

    def __init__(self, db_path: Path = AUTH_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Initializes the SQLite tables for users and blacklisted tokens."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Blacklisted Tokens table (Token Blacklisting Model)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS blacklisted_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token TEXT UNIQUE NOT NULL,
                    token_jti TEXT,
                    user_email TEXT,
                    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
            """)

            # Indices for rapid lookup
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_blacklisted_token ON blacklisted_tokens(token)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_blacklisted_jti ON blacklisted_tokens(token_jti)")

            conn.commit()
            logger.info("Auth & Token Blacklist database initialized successfully.")

    # -------------------------------------------------------------
    # Password Hashing & Verification (Zero-dependency PBKDF2-SHA256)
    # -------------------------------------------------------------
    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes password with PBKDF2-HMAC-SHA256 and cryptographic salt."""
        salt = os.urandom(16).hex()
        iterations = 100_000
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        return f"pbkdf2:sha256:{iterations}${salt}${key.hex()}"

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain password against the stored PBKDF2-SHA256 hash."""
        try:
            algorithm, salt, key_hex = hashed_password.split("$")
            parts = algorithm.split(":")
            iterations = int(parts[2]) if len(parts) > 2 else 100_000
            
            computed_key = hashlib.pbkdf2_hmac(
                'sha256',
                plain_password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations
            )
            return hmac.compare_digest(computed_key.hex(), key_hex)
        except Exception as e:
            logger.warning(f"Error during password verification: {e}")
            return False

    # -------------------------------------------------------------
    # JWT Token Generation & Validation
    # -------------------------------------------------------------
    def create_access_token(self, user_dict: Dict[str, Any]) -> str:
        """Generates a signed JWT with unique jti and expiration."""
        now = datetime.now(timezone.utc)
        expire_dt = now + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        jti = uuid.uuid4().hex

        payload = {
            "sub": user_dict["email"],
            "name": user_dict["name"],
            "id": user_dict["id"],
            "jti": jti,
            "iat": int(now.timestamp()),
            "exp": int(expire_dt.timestamp())
        }

        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return token

    # -------------------------------------------------------------
    # Token Blacklisting Model Operations
    # -------------------------------------------------------------
    def blacklist_token(self, token: str) -> bool:
        """
        Blacklists a token so it cannot be used again after logout.
        Records token hash/string, JTI, and user email into SQLite.
        """
        try:
            # Decode token without verification to get metadata even if expiring
            unverified_payload = jwt.decode(
                token, 
                options={"verify_signature": False, "verify_exp": False}
            )
            token_jti = unverified_payload.get("jti")
            user_email = unverified_payload.get("sub")
            exp_timestamp = unverified_payload.get("exp")
            expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).isoformat() if exp_timestamp else None
        except Exception:
            token_jti = None
            user_email = None
            expires_at = None

        with self._get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO blacklisted_tokens (token, token_jti, user_email, blacklisted_at, expires_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
                """, (token, token_jti, user_email, expires_at))
                conn.commit()
                logger.info(f"Token revoked & blacklisted for user {user_email} (jti: {token_jti}).")
                return True
            except Exception as e:
                logger.error(f"Failed to blacklist token: {e}")
                return False

    def is_token_blacklisted(self, token: str, jti: Optional[str] = None) -> bool:
        """Checks if a given token or JTI exists in the blacklist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if jti:
                cursor.execute("SELECT 1 FROM blacklisted_tokens WHERE token = ? OR token_jti = ?", (token, jti))
            else:
                cursor.execute("SELECT 1 FROM blacklisted_tokens WHERE token = ?", (token,))
            row = cursor.fetchone()
            return row is not None

    def get_blacklisted_tokens(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns recent blacklisted tokens for inspection / auditing."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, token_jti, user_email, blacklisted_at, expires_at 
                FROM blacklisted_tokens 
                ORDER BY id DESC 
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def get_blacklisted_count(self) -> int:
        """Returns total count of blacklisted tokens."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM blacklisted_tokens")
            res = cursor.fetchone()
            return res[0] if res else 0

    # -------------------------------------------------------------
    # User Registration, Login & Email Check
    # -------------------------------------------------------------
    def check_user_exists(self, email: str) -> bool:
        """Checks if an email is already registered."""
        email_clean = email.strip().lower()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)", (email_clean,))
            return cursor.fetchone() is not None

    def register_user(self, name: str, email: str, password: str) -> Tuple[Dict[str, Any], str]:
        """
        Registers a new user account.
        Raises UserAlreadyExistsException if email is already registered.
        """
        name_clean = name.strip()
        email_clean = email.strip().lower()

        if self.check_user_exists(email_clean):
            raise UserAlreadyExistsException(f"Account with email '{email_clean}' is already registered. Please log in.")

        password_hash = self.hash_password(password)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (name, email, password_hash)
                VALUES (?, ?, ?)
            """, (name_clean, email_clean, password_hash))
            user_id = cursor.lastrowid
            conn.commit()

        user_dict = {
            "id": user_id,
            "name": name_clean,
            "email": email_clean
        }

        access_token = self.create_access_token(user_dict)
        logger.info(f"New user registered successfully: {email_clean} (id: {user_id})")
        return user_dict, access_token

    def login_user(self, email: str, password: str, name: Optional[str] = None) -> Tuple[Dict[str, Any], str]:
        """
        Logs in an existing user.
        Raises UserNotFoundException if email is not found.
        Raises InvalidCredentialsException if password does not match.
        """
        email_clean = email.strip().lower()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER(?)", (email_clean,))
            row = cursor.fetchone()

        if not row:
            raise UserNotFoundException(f"No account found for '{email_clean}'. Please register first.")

        user_data = dict(row)
        if not self.verify_password(password, user_data["password_hash"]):
            raise InvalidCredentialsException("Invalid password. Please check your credentials and try again.")

        user_dict = {
            "id": user_data["id"],
            "name": user_data["name"],
            "email": user_data["email"],
            "created_at": user_data.get("created_at")
        }

        access_token = self.create_access_token(user_dict)
        logger.info(f"User logged in successfully: {email_clean}")
        return user_dict, access_token

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Decodes and verifies a JWT token.
        Verifies signature, expiration, and checks that the token is NOT blacklisted.
        """
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise InvalidTokenException("Your session has expired. Please log in again.")
        except jwt.PyJWTError as e:
            raise InvalidTokenException(f"Invalid authentication token: {str(e)}")

        jti = payload.get("jti")
        if self.is_token_blacklisted(token, jti):
            raise TokenRevokedException("This session token has been revoked (logged out). Please log in again.")

        email = payload.get("sub")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, created_at FROM users WHERE LOWER(email) = LOWER(?)", (email,))
            row = cursor.fetchone()

        if not row:
            raise InvalidTokenException("User associated with this token no longer exists.")

        return dict(row)


# Global singleton instance
auth_service = AuthService()
