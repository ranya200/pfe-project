from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('rct.urls')),
    path('api/', include('audit.urls')),
    path('api/', include('risk_management.urls')),
    path('api/', include('assistance_technique.urls')),
    path('api/', include('clients.urls')),
    path('api/', include('ai.urls')),
    path('api/', include('bilan.urls')),
    path('api/', include('notifications.urls')),  # ← AJOUTÉ
    path('api/auth/', include('knox.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]