from django.urls import path

from . import views

app_name = 'posts'

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('load_posts', views.load_posts, name='load_posts'),
    path('register', views.register, name='register'),
    path('new_post', views.new_post, name='new_post'),
    path('like/<int:post_id>', views.like_post, name='like_post'),
    path('new_comment/', views.new_comment, name='new_comment'),
    path('follow/<int:user_id>', views.follow, name='follow'),
    path('follow_data/', views.follow_data, name='follow_data'),
    path('profile_info/<user_id>', views.profile_info, name='profile_info'),
    path('load_member_posts/<user_id>', views.load_member_posts, name='load_member_posts'),
    path('edit_data/<post_id>', views.edit_data, name='edit_data'),
    path('edit_post/<post_id>', views.edit_post, name='edit_post')
]
