from __future__ import annotations

from fastapi import Request

from .config import Settings
from .services.credit_service import CreditService
from .services.job_service import JobService
from .services.payment_service import PaymentService


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_job_service(request: Request) -> JobService:
    return request.app.state.job_service


def get_credit_service(request: Request) -> CreditService:
    return request.app.state.credits


def get_payment_service(request: Request) -> PaymentService:
    return request.app.state.payments
