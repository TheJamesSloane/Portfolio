from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models


class User(AbstractUser):
    pass


# Model for different listings
class Listing(models.Model):

    # Each listing should belong to one of several categories
    CATEGORY_CHOICES = [
    ("Magical Confectionery", "Magical Confectionery"),
    ("Magical Artefacts", "Magical Artefacts"),
    ("Potion Ingredients", "Potion Ingredients"),
    ("Magical Pets", "Magical Pets"),
    ("Quidditch Equipment", "Quidditch Equipment"),
    ("Wizarding Books", "Wizarding Books"),
    ("Wizarding Apparel", "Wizarding Apparel"),
    ("Dark Arts", "Dark Arts"),
    ("Muggle Artefacts", "Muggle Artefacts"),
    ("Magical Furniture", "Magical Furniture"),
    ("Magical Appliances", "Magical Appliances"),
    ("Magical Tools", "Magical Tools"),
    ("Wizarding Posters", "Wizarding Posters"),
    ("Wizarding Collectibles", "Wizarding Collectibles"),
    ("Magical Transportation", "Magical Transportation"),
    ("Other", "Other"),
]

    title = models.CharField(max_length=64)
    description = models.TextField()
    starting_bid = models.IntegerField(validators=[MinValueValidator(0)])
    highest_bid = models.IntegerField(validators=[MinValueValidator(0)], null=True, blank=True)
    highest_bidder = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='highest_bidder_listings')
    image = models.ImageField(upload_to="images", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    sold_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchased_listings')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    watchlist = models.ManyToManyField(User, related_name='watchlist', blank=True, null=True)




# Simply captures who makes the bid and how much is being bid
class Bid(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    bid = models.IntegerField(validators=[MinValueValidator(0)])


# Comments functionality for listings
class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    text = models.TextField()
    time = models.DateTimeField(auto_now_add=True)
