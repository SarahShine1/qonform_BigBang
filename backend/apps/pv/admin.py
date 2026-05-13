from django.contrib import admin
from .models import PV, PVParticipant


class PVParticipantInline(admin.TabularInline):
    model = PVParticipant
    extra = 1


@admin.register(PV)
class PVAdmin(admin.ModelAdmin):
    list_display = ['code', 'type', 'date', 'participant_count', 'created_at']
    list_filter = ['type', 'date', 'created_at']
    search_fields = ['code', 'type']
    readonly_fields = ['code', 'created_at', 'updated_at']
    inlines = [PVParticipantInline]  # ← remplace filter_horizontal

    fieldsets = (
        ('PV Information', {
            'fields': ('code', 'type', 'date')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
        # ← 'Participants' et 'Document' retirés des fieldsets
    )

    filter_horizontal = []  # ← vide

    def participant_count(self, obj):
        return obj.participants.count()

    participant_count.short_description = 'Participants'