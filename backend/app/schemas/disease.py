"""Pydantic schemas for multimodal crop disease analysis."""

from typing import Literal

from pydantic import BaseModel, Field


class AIObservation(BaseModel):
    """Strict structure requested from the multimodal model.

    The model may only describe what it can see. Treatment content is merged
    from the verified knowledge base by the backend.
    """

    crop_name: str = Field(default="Unclear", max_length=80)
    possible_disease: str = Field(default="Unclear", max_length=160)
    diagnostic_status: Literal[
        "Possible match",
        "Uncertain",
        "Insufficient image quality",
        "No clear disease visible",
    ] = "Uncertain"
    certainty_level: Literal["Low", "Moderate", "High", "Not assessable"] = "Not assessable"
    confidence_score: None = None
    image_quality: Literal["Poor", "Fair", "Good", "Excellent"] = "Fair"
    visual_observations: list[str] = Field(default_factory=list)
    alternative_possibilities: list[str] = Field(default_factory=list)
    symptoms: list[str] = Field(default_factory=list)
    possible_causes: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)
    expert_consultation: bool = True
    disclaimer: str = ""


class DiseaseAnalysisResult(AIObservation):
    knowledge_base_match: bool = False
    knowledge_source: str | None = None
    knowledge_last_verified: str | None = None
    image_info: dict = Field(default_factory=dict)
    language: str = "en"
    analyzed_at: str | None = None


class DiseaseHistoryItem(BaseModel):
    id: int
    crop_name: str
    possible_disease: str
    certainty_level: str
    visual_observations: list[str]
    recommendations: dict
    created_at: str
