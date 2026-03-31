
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('rct.urls')),
    path('api/', include('audit.urls')),   # ← Journal d'audit ISO 9001/27001
    path('api/auth/', include('knox.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

