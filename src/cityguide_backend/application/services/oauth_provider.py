from __future__ import annotations

import urllib.parse
from typing import Any

import httpx

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import AuthenticationError


class OAuthProviderService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def get_google_auth_url(self, redirect_uri: str) -> str:
        if not self._settings.google_client_id:
            raise AuthenticationError("Google OAuth is not configured on server")
        params = {
            "client_id": self._settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "select_account",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    async def fetch_google_user(self, code: str, redirect_uri: str) -> dict[str, str]:
        if not self._settings.google_client_id or not self._settings.google_client_secret:
            raise AuthenticationError("Google OAuth is not configured on server")

        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self._settings.google_client_id,
                    "client_secret": self._settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            if token_resp.status_code != 200:
                raise AuthenticationError("Failed to exchange code for Google token")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise AuthenticationError("No access_token returned by Google")

            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                raise AuthenticationError("Failed to fetch user profile from Google")

            data = userinfo_resp.json()
            oauth_id = str(data.get("id", ""))
            email = data.get("email", "")
            full_name = data.get("name") or email.split("@")[0]

            if not email or not oauth_id:
                raise AuthenticationError("Google profile did not contain email or ID")

            return {"oauth_id": oauth_id, "email": email, "full_name": full_name}

    def get_github_auth_url(self, redirect_uri: str) -> str:
        if not self._settings.github_client_id:
            raise AuthenticationError("GitHub OAuth is not configured on server")
        params = {
            "client_id": self._settings.github_client_id,
            "redirect_uri": redirect_uri,
            "scope": "user:email",
        }
        return f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"

    async def fetch_github_user(self, code: str, redirect_uri: str) -> dict[str, str]:
        if not self._settings.github_client_id or not self._settings.github_client_secret:
            raise AuthenticationError("GitHub OAuth is not configured on server")

        headers = {"Accept": "application/json", "User-Agent": "cityguide-backend"}

        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": self._settings.github_client_id,
                    "client_secret": self._settings.github_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            if token_resp.status_code != 200:
                raise AuthenticationError("Failed to exchange code for GitHub token")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise AuthenticationError("No access_token returned by GitHub")

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={**headers, "Authorization": f"Bearer {access_token}"},
            )
            if user_resp.status_code != 200:
                raise AuthenticationError("Failed to fetch user profile from GitHub")

            user_data = user_resp.json()
            oauth_id = str(user_data.get("id", ""))
            email = user_data.get("email")
            full_name = user_data.get("name") or user_data.get("login") or "GitHub User"

            if not email:
                # GitHub emails endpoint
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={**headers, "Authorization": f"Bearer {access_token}"},
                )
                if emails_resp.status_code == 200:
                    emails_data = emails_resp.json()
                    primary_email = next(
                        (e["email"] for e in emails_data if e.get("primary") and e.get("verified")),
                        None,
                    )
                    if not primary_email and emails_data:
                        primary_email = emails_data[0].get("email")
                    email = primary_email

            if not email or not oauth_id:
                raise AuthenticationError("GitHub profile did not contain verified email or ID")

            return {"oauth_id": oauth_id, "email": email, "full_name": full_name}
