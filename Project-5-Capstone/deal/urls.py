from django.urls import path

from . import views

app_name = 'deal'

urlpatterns = [
    path('', views.index, name='index'),
    path('record_score/', views.record_score, name='record_score'),
]
