from __future__ import annotations


class AppError(Exception):
    status_code = 400
    error_code = "bad_request"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ValidationAppError(AppError):
    status_code = 422
    error_code = "validation_error"


class AuthenticationError(AppError):
    status_code = 401
    error_code = "authentication_error"


class AuthorizationError(AppError):
    status_code = 403
    error_code = "authorization_error"


class NotFoundError(AppError):
    status_code = 404
    error_code = "not_found"


class ConflictError(AppError):
    status_code = 409
    error_code = "conflict"


class ExternalServiceError(AppError):
    status_code = 502
    error_code = "external_service_error"


class RateLimitError(AppError):
    status_code = 429
    error_code = "rate_limit_exceeded"


class NoSearchResultsError(AppError):
    status_code = 404
    error_code = "no_search_results"
