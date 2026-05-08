from django.contrib import admin

from .models import OrganizationUnit


@admin.register(OrganizationUnit)
class OrganizationUnitAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'parent', 'level', 'is_active')
    list_filter = ('type', 'is_active')
    search_fields = ('code', 'name')

