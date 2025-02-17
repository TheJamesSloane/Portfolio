# Generated by Django 5.1.3 on 2024-12-07 15:48

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Listing',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=64)),
                ('description', models.TextField()),
                ('starting_bid', models.IntegerField(validators=[django.core.validators.MinValueValidator(0)])),
                ('highest_bid', models.IntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('image', models.ImageField(blank=True, null=True, upload_to='images')),
                ('is_active', models.BooleanField(default=True)),
                ('category', models.CharField(choices=[('Magical Confectionery', 'Magical Confectionery'), ('Magical Artefacts', 'Magical Artefacts'), ('Potion Ingredients', 'Potion Ingredients'), ('Magical Pets', 'Magical Pets'), ('Quidditch Equipment', 'Quidditch Equipment'), ('Wizarding Books', 'Wizarding Books'), ('Wizarding Apparel', 'Wizarding Apparel'), ('Dark Arts', 'Dark Arts'), ('Muggle Artefacts', 'Muggle Artefacts'), ('Magical Furniture', 'Magical Furniture'), ('Magical Appliances', 'Magical Appliances'), ('Magical Tools', 'Magical Tools'), ('Wizarding Posters', 'Wizarding Posters'), ('Wizarding Collectibles', 'Wizarding Collectibles'), ('Magical Transportation', 'Magical Transportation'), ('Other', 'Other')], max_length=32)),
                ('highest_bidder', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='highest_bidder_listings', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('sold_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='purchased_listings', to=settings.AUTH_USER_MODEL)),
                ('watchlist', models.ManyToManyField(blank=True, null=True, related_name='watchlist', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('time', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auctions.listing')),
            ],
        ),
        migrations.CreateModel(
            name='Bid',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bid', models.IntegerField(validators=[django.core.validators.MinValueValidator(0)])),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auctions.listing')),
            ],
        ),
    ]
