# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_root(request):
    return JsonResponse({
        "status": "ok",
        "message": "Qonform API is running 🚀",
        "version": "1.0.0",
        "docs": "/api/schema/swagger-ui/",
        "admin": "/admin/",
    })


urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),


    path('api/v1/auth/',       include('apps.accounts.urls')),
    path('api/v1/messaging/',  include('apps.messaging.urls')),
    path('api/v1/organigramme/', include('apps.organigramme.urls')),

    path('api/v1/processus/',  include('apps.processus.urls')),
    path('api/v1/fiches/',     include('apps.fiches.urls')),
    path('api/v1/audit/',      include('apps.audit.urls')),
    path('api/v1/documents/',  include('apps.documents.urls')),
    path('api/v1/pilotage/',   include('apps.pilotage.urls')),
    path('api/v1/diagnostic/', include('apps.diagnostic.urls')),

    path('api/v1/taches/',     include('apps.taches.urls')),
    path('api/v1/pv/',         include('apps.pv.urls')),

]


if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    import debug_toolbar
    urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

