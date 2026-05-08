# backend/apps/documents/models.py

from django.db import models
from django.conf import settings


class Document(models.Model):
    titre = models.CharField(max_length=255)
    fichier = models.FileField(upload_to='documents/')
    publie_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documents_publies'
    )
    date_publication = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_publication']

    def __str__(self):
        return self.titre