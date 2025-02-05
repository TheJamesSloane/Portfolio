from django.db import models

# Create your models here.

# A model that is run each time a new game is started
class Score(models.Model):
    username = models.CharField(max_length=32)
    winnings = models.IntegerField()
    date = models.DateField(auto_now_add=True)