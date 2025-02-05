from . import views
from django.urls import path

# Set a name for the app - "wiki" was used in the app already
app_name = 'wiki'

urlpatterns = [
    path("", views.index, name = "index"),
    path("wiki/<str:title>", views.get_page, name = "title"),
    path("new", views.save_page, name = "new"),
    path("edit/<title>", views.edit_page, name="edit"),
    path("random", views.random_page, name="random"),
    path("search", views.search, name="search")
]
