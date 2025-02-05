from django import forms
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages


from .models import User, Bid, Listing, Comment


class ListingForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = [
            'title',
            'description',
            'category',
            'starting_bid',
            'image'
        ]
        # Make the label include the currency (Galleons)
        labels = {
            'starting_bid': 'Starting Bid (₲)',
        }
    # Set the different style characteristics
    def __init__(self, *args, **kwargs):
        super(ListingForm, self).__init__(*args, **kwargs)
        self.fields['title'].widget.attrs.update({'style': 'width: 100%; vertical-align: middle;'})
        self.fields['description'].widget.attrs.update({'style': 'width: 100%; vertical-align: middle;'})
        self.fields['category'].widget.attrs.update({'style': 'width: 100%; vertical-align: middle;'})
        self.fields['starting_bid'].widget.attrs.update({'style': 'width: 100%; vertical-align: middle;'})


class BidForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = ['highest_bid']


# List all of the items currently for sale
def index(request):
    listings = Listing.objects.filter(
                is_active=True
            )
    return render(request, 'auctions/index.html', {
        'listings': listings
    })

# List all of the items for which the listings are inactive
def inactive(request):
    listings = Listing.objects.filter(
        is_active=False
    )
    return render(request, 'auctions/inactive.html', {
        'listings': listings
    })


def login_view(request):
    if request.method == 'POST':

        # Attempt to sign user in
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('auction:index'))
        else:
            return render(request, 'auctions/login.html', {
                'message': 'Invalid username and/or password.'
            })
    else:
        return render(request, 'auctions/login.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('auction:index'))


def register(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']

        # Ensure that the password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'auctions/register.html', {
                'message': 'Passwords must match.'
            })

        # Attempt to create a new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, 'auctions/register.html', {
                'message': 'Username already taken.'
            })
        login(request, user)
        return HttpResponseRedirect(reverse('auction:index'))
    else:
        return render(request, 'auctions/register.html')


def add_listing(request):
    if request.method == 'POST':
        form = ListingForm(request.POST, request.FILES)
        if form.is_valid():
            listing = form.save(commit=False)
            listing.owner = request.user
            listing.save()
            return redirect('auction:index')
        else:
            print(form.errors)
    else:
        form = ListingForm()
    
    return render(request, 'auctions/add_listing.html', {
        'form': form
    })


def view_listing(request, listing_id):

    # If the user is not authenticated, redirect them to the login page
    if not request.user.is_authenticated:
        return redirect('auction:login')  # Refresh the page

    # Fetch the listing manually
    listing = Listing.objects.filter(id=listing_id).first()

    if not listing:
        return render(request, 'auctions/error.html', {'message': 'Listing not found.'})

    # Check if the listing is watchlisted by the user
    watchlisted = listing.watchlist.filter(id=request.user.id).exists()

    # Get the highest bid and the user who made it
    highest_bid = None
    highest_bidder = None
    if listing.highest_bid is not None:
        highest_bid = listing.highest_bid
        highest_bidder = Bid.objects.filter(listing=listing, bid=highest_bid).first().user

    # Calculate the minimum bid value
    if listing.highest_bid is not None:
        min_bid = listing.highest_bid + 1
    else:
        min_bid = listing.starting_bid

    if request.method == 'POST':
        # Handle Watchlist toggle
        if 'watchlist' in request.POST:
            if watchlisted:
                listing.watchlist.remove(request.user)
            else:
                listing.watchlist.add(request.user)
            return redirect('auction:view_listing', listing_id=listing_id)
        
        # Handle the logic if the user decides to sell the item
        if "sell-item" in request.POST:
            listing.is_active = False
            listing.sold_to = listing.highest_bidder
            listing.save()
            listings = Listing.objects.filter(
                is_active=True
            )
            return render(request, 'auctions/index.html', {
                'listings': listings
            })
            
        if "delist-item" in request.POST:
            # Logic to remove the listing
            listing.is_active = False
            listing.save()
            listings = Listing.objects.filter(
                is_active=True
            )
            return render(request, 'auctions/index.html', {
                'listings': listings
            })

        # Handle bid submission
        if 'bid' in request.POST:
            bid_value = request.POST.get('bid')
            if bid_value:
                try:
                    bid = int(bid_value)
                except ValueError:
                    return render(request, 'auctions/listing.html', {
                        'listing': listing,
                        'error_message': 'Invalid bid value.'
                    })

            if bid is not None:
                # Ensure that the bid is valid
                if bid >= min_bid:
                    # Create and save the new bid
                    Bid.objects.create(user=request.user, bid=bid, listing=listing)
                    listing.highest_bid = bid
                    listing.highest_bidder = request.user
                    listing.save()
                    return redirect("auction:view_listing", listing_id=listing.id)
                else:
                    return render(request, 'auctions/listing.html', {
                        'listing': listing,
                        'error_message': f'Bid must be at least ₲{min_bid}.'
                    })
        
        # Handle comment submission
        elif 'comment' in request.POST:
            comment_text = request.POST.get('comment')
            if comment_text:
                comment = Comment(listing=listing, user=request.user, text=comment_text)
                comment.save()

                return redirect('auction:view_listing', listing_id=listing.id)

    # Fetch comments related to this listing
    comments = Comment.objects.filter(listing=listing)

    return render(request, 'auctions/listing.html', {
        'listing': listing,
        'comments': comments,
        'watchlisted': watchlisted,
        'is_owner': listing.owner == request.user,
        'highest_bid': highest_bid,
        'highest_bidder': highest_bidder,
        'min_bid': min_bid
    })


def watchlist(request):
    # Fetch the listings that the user has watchlisted
    watchlisted_listings = Listing.objects.filter(
        watchlist=request.user,
        is_active=True
    )

    # Render the watchlist page with the filtered listings
    return render(request, 'auctions/watchlist.html', {
        'listings': watchlisted_listings
    })


# Be able to view listings by category
def categories(request):
    # Get the selected category from the query parameters
    selected_category = request.GET.get('category', None)

    # Fetch all active listings or filter by category if specified
    if selected_category:
        listings = Listing.objects.filter(category=selected_category, is_active=True)
    else:
        listings = Listing.objects.filter(is_active=True)

    # Fetch all unique categories for the dropdown menu
    categories = Listing.CATEGORY_CHOICES

    return render(request, 'auctions/categories.html', {
        'listings': listings,
        'categories': categories,
        'selected_category': selected_category,
    })