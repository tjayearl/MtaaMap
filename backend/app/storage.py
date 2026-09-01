"""Firebase Storage integration for photo uploads."""
import os
from typing import Optional

import firebase_admin
from firebase_admin import credentials, storage

from app.config import settings


def init_firebase() -> bool:
    """Initialize Firebase Admin SDK if credentials are configured."""
    if not settings.firebase_credentials_path or firebase_admin._apps:
        return False
    
    try:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        firebase_admin.initialize_app(cred)
        return True
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        return False


def upload_photo(file_data: bytes, file_name: str, bucket_name: Optional[str] = None) -> Optional[str]:
    """
    Upload a photo to Firebase Storage.
    
    Args:
        file_data: Binary file data
        file_name: File name (e.g., 'points/abc123.jpg')
        bucket_name: Optional custom bucket name, defaults to configured Firebase bucket
        
    Returns:
        Public URL to the uploaded file, or None if upload fails
    """
    if not settings.firebase_credentials_path:
        return None
    
    try:
        bucket = storage.bucket(bucket_name)
        blob = bucket.blob(file_name)
        blob.upload_from_string(file_data, content_type="image/jpeg")
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print(f"Firebase upload failed: {e}")
        return None


def delete_photo(file_path: str, bucket_name: Optional[str] = None) -> bool:
    """
    Delete a photo from Firebase Storage.
    
    Args:
        file_path: File path in Firebase (e.g., 'points/abc123.jpg')
        bucket_name: Optional custom bucket name
        
    Returns:
        True if deletion was successful, False otherwise
    """
    if not settings.firebase_credentials_path:
        return False
    
    try:
        bucket = storage.bucket(bucket_name)
        blob = bucket.blob(file_path)
        blob.delete()
        return True
    except Exception as e:
        print(f"Firebase delete failed: {e}")
        return False
