from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Follow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower_set')
    class Meta:
        # Ensure that a user can't follow the same person twice
        unique_together = ('user', 'follower')


class Post(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='posts')
    text = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField('User', related_name='liked_posts', blank=True)

    def __str__(self):
        return self.text[:50]
    
    def user_id(self):
        return self.user.id


class Comment(models.Model):
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def user_id(self):
        return self.user.id