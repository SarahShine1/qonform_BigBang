import re
import unicodedata

from django.db import models


DICTIONARY_CATEGORY_CHOICES = [
    ("Qualite", "Qualite"),
    ("Audit", "Audit"),
    ("Processus", "Processus"),
    ("ISO 9001", "ISO 9001"),
    ("Documentaire", "Documentaire"),
    ("Risque", "Risque"),
    ("Indicateur", "Indicateur"),
    ("Autre", "Autre"),
]


def normalize_term(value):
    stripped = " ".join(str(value or "").strip().split())
    ascii_value = unicodedata.normalize("NFKD", stripped).encode(
        "ascii", "ignore"
    ).decode("ascii")
    return re.sub(r"\s+", " ", ascii_value).strip().lower()


class DictionaryTerm(models.Model):
    id = models.BigAutoField(primary_key=True)
    term = models.CharField(max_length=150, unique=True)
    normalized_term = models.CharField(max_length=180, db_index=True)
    category = models.CharField(max_length=50, choices=DICTIONARY_CATEGORY_CHOICES)
    definition = models.TextField()
    example = models.TextField(blank=True, default="")
    synonyms = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        "accounts.Utilisateur",
        on_delete=models.SET_NULL,
        related_name="dictionary_terms_created",
        null=True,
        blank=True,
        db_constraint=False,
    )
    updated_by = models.ForeignKey(
        "accounts.Utilisateur",
        on_delete=models.SET_NULL,
        related_name="dictionary_terms_updated",
        null=True,
        blank=True,
        db_constraint=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["term", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["normalized_term"],
                name="uniq_dictionary_normalized_term",
            )
        ]

    def save(self, *args, **kwargs):
        self.term = " ".join(str(self.term or "").strip().split())
        self.normalized_term = normalize_term(self.term)
        self.example = str(self.example or "").strip()
        self.synonyms = [
            str(item).strip()
            for item in (self.synonyms or [])
            if str(item or "").strip()
        ]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.term

