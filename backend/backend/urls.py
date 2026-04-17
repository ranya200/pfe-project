from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('rct.urls')),
    path('api/', include('audit.urls')),
    path('api/', include('risk_management.urls')),
    path('api/auth/', include('knox.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ← Catch-all : tout ce qui n'est pas /api/ va vers React
urlpatterns += [
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name='index.html')),
]