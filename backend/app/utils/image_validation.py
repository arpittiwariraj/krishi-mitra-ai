"""Uploaded image validation and safe re-encoding.

Uploaded files are never stored permanently. Images are validated with Pillow,
EXIF metadata is stripped, and the bytes are re-encoded to JPEG before being
sent to the multimodal model.
"""

import io

from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MIN_DIMENSION = 200
MAX_DIMENSION = 2048


class ImageValidationError(Exception):
    def __init__(self, message: str, error_code: str = "INVALID_IMAGE"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code


def validate_and_prepare_image(
    file_bytes: bytes,
    content_type: str | None,
    filename: str | None,
    max_size_mb: int = 10,
) -> tuple[bytes, str, dict]:
    """Validate an uploaded image and return JPEG bytes plus metadata."""

    if not file_bytes:
        raise ImageValidationError("The uploaded file is empty.", "EMPTY_FILE")

    max_bytes = max_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise ImageValidationError(
            f"Image is too large. Maximum allowed size is {max_size_mb} MB.",
            "FILE_TOO_LARGE",
        )

    normalized_type = (content_type or "").lower().split(";")[0]
    suffix = (filename or "").lower().rsplit(".", 1)[-1] if "." in (filename or "") else ""
    if normalized_type not in ALLOWED_CONTENT_TYPES and suffix not in {
        "jpg",
        "jpeg",
        "png",
        "webp",
    }:
        raise ImageValidationError(
            "Unsupported image format. Upload a JPG, JPEG, PNG or WEBP file.",
            "UNSUPPORTED_FORMAT",
        )

    try:
        with Image.open(io.BytesIO(file_bytes)) as probe:
            probe.verify()
        with Image.open(io.BytesIO(file_bytes)) as image:
            image_format = image.format
            if image_format not in ALLOWED_FORMATS:
                raise ImageValidationError(
                    "Unsupported image format. Upload a JPG, JPEG, PNG or WEBP file.",
                    "UNSUPPORTED_FORMAT",
                )
            width, height = image.size
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                raise ImageValidationError(
                    "Image resolution is too low. Use at least 200 x 200 pixels.",
                    "IMAGE_TOO_SMALL",
                )

            image = ImageOps.exif_transpose(image)
            image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

            if image.mode in {"RGBA", "LA"} or (
                image.mode == "P" and "transparency" in image.info
            ):
                rgba = image.convert("RGBA")
                background = Image.new("RGB", rgba.size, (255, 255, 255))
                background.paste(rgba, mask=rgba.split()[-1])
                image = background
            elif image.mode != "RGB":
                image = image.convert("RGB")

            output = io.BytesIO()
            image.save(output, format="JPEG", quality=88, optimize=True)
            prepared = output.getvalue()
            prepared_width, prepared_height = image.size
    except ImageValidationError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ImageValidationError(
            "The file is corrupted or is not a valid image. Please upload another photo.",
            "CORRUPTED_IMAGE",
        ) from exc

    metadata = {
        "original_format": image_format,
        "original_size_bytes": len(file_bytes),
        "prepared_size_bytes": len(prepared),
        "width": prepared_width,
        "height": prepared_height,
        "mime_type": "image/jpeg",
    }
    return prepared, "image/jpeg", metadata
