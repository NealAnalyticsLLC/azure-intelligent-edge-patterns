"""App models.
"""

import logging

import requests
from django.db import models
from django.utils import timezone
from rest_framework.exceptions import APIException

from ..azure_parts.models import Part
from ..azure_projects.models import Project
from ..cameras.models import Camera
from ..inference_modules.models import InferenceModule
from .constants import (
    INFERENCE_MODE_CHOICES,
    INFERENCE_PROTOCOL_CHOICES,
    INFERENCE_SOURCE_CHOICES,
)
from .exceptions import (
    PdDeployWithoutCameras,
    PdDeployWithoutInferenceModule,
    PdDeployWithoutProject,
    PdProbThresholdNotInteger,
    PdProbThresholdOutOfRange,
)

logger = logging.getLogger(__name__)


class PartDetection(models.Model):
    """PartDetection Model"""

    name = models.CharField(blank=True, max_length=200)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)
    cameras = models.ManyToManyField(Camera, blank=True)
    inference_module = models.ForeignKey(
        InferenceModule, on_delete=models.SET_NULL, null=True
    )
    inference_mode = models.CharField(
        max_length=40, choices=INFERENCE_MODE_CHOICES, default="PD"
    )
    inference_protocol = models.CharField(
        max_length=40, choices=INFERENCE_PROTOCOL_CHOICES, default="http"
    )
    inference_source = models.CharField(
        max_length=40, choices=INFERENCE_SOURCE_CHOICES, default="lva"
    )
    parts = models.ManyToManyField(Part, blank=True)
    needRetraining = models.BooleanField(default=True)
    deployed = models.BooleanField(default=False)
    deploy_timestamp = models.DateTimeField(default=timezone.now)
    has_configured = models.BooleanField(default=False)

    accuracyRangeMin = models.IntegerField(default=30)
    accuracyRangeMax = models.IntegerField(default=80)

    maxImages = models.IntegerField(default=10)
    metrics_is_send_iothub = models.BooleanField(default=False)
    metrics_frame_per_minutes = models.IntegerField(default=6)
    prob_threshold = models.IntegerField(default=60)
    fps = models.IntegerField(default=10)

    def update_prob_threshold(self, prob_threshold):
        """update confidenece threshold of BoundingBox"""
        self.prob_threshold = prob_threshold

        if not isinstance(prob_threshold, int):
            raise PdProbThresholdNotInteger
        if prob_threshold > 100 or prob_threshold < 0:
            raise PdProbThresholdOutOfRange
        self.save()
        requests.get(
            "http://" + self.inference_module.url + "/update_prob_threshold",
            params={"prob_threshold": prob_threshold},
        )

    def is_deployable(self, raise_exception: bool = False) -> bool:
        """is_deployable.

        Args:
            raise_exception (bool): raise_exception

        Returns:
            bool: is_deployable
        """
        try:
            if not self.inference_module:
                raise PdDeployWithoutInferenceModule
            if not self.project:
                raise PdDeployWithoutProject
            if not self.cameras.all().exists():
                raise PdDeployWithoutCameras
            self.project.is_deployable(raise_exception=True)
            return True
        except APIException:
            if raise_exception:
                raise
            return False

    def send_video_to_cloud(self):
        return [
            {"camera_id": cam.id, "send_video_to_cloud": cam.send_video_to_cloud}
            for cam in self.cameras.all()
        ]

    def __str__(self) -> str:
        return self.name.__str__()

    def __repr__(self) -> str:
        return self.name.__repr__()


class PDScenario(models.Model):
    """PartDetection Model"""

    name = models.CharField(blank=True, max_length=200)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True)
    cameras = models.ManyToManyField(Camera, blank=True)
    inference_mode = models.CharField(
        max_length=40, choices=INFERENCE_MODE_CHOICES, default="PD"
    )
    parts = models.ManyToManyField(Part, blank=True)
