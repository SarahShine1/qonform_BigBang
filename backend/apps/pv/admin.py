from django.contrib import admin
from .models import PV, PVParticipant


class PVParticipantInline(admin.TabularInline):
    model = PVParticipant
    extra = 1


@admin.register(PV)
class PVAdmin(admin.ModelAdmin):
    list_display = ['code', 'categorie', 'sous_type', 'statut', 'date', 'participant_count', 'created_at']
    list_filter = ['categorie', 'sous_type', 'statut', 'date', 'created_at']
    search_fields = ['code', 'categorie', 'sous_type']
    readonly_fields = ['code', 'created_at', 'updated_at']
    inlines = [PVParticipantInline]

    fieldsets = (
        ('PV Information', {
            'fields': ('code', 'categorie', 'sous_type', 'statut', 'date')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    filter_horizontal = []

    def participant_count(self, obj):
        return obj.participants.count()

    participant_count.short_description = 'Participants'