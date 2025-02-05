from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

app_name = 'auction'

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('register', views.register, name='register'),
    path('inactive', views.inactive, name='inactive'),
    path('add_listing', views.add_listing, name='add_listing'),
    path('listing/<int:listing_id>', views.view_listing, name='view_listing'),
    path('watchlist', views.watchlist, name='watchlist'),
    path('categories', views.categories, name='categories')
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)