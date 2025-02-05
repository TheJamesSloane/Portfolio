from django import forms
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
import json

from .models import User, Follow, Post, Comment


# Form for subkitting posts
class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['text']


# Form for submitting comments
class PostComment(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']


# Some initial information
def index(request):
    # Initialise posts as an empty queryset
    posts = Post.objects.none()
    following_posts = Post.objects.none()

    # Initialise follow counts
    followers_count = 0
    following_count = 0
    following_users = []

    # Check if the user is authenticated
    if request.user.is_authenticated:
        user = request.user

        # Get the count of followers and following (number of those being followed) for the authenticated user
        followers_count = Follow.objects.filter(user=user).count()
        following_count = Follow.objects.filter(follower=user).count()

        # Get the list of users the current user is following
        following_users = Follow.objects.filter(follower=user).values_list('user', flat=True)

        # Get posts only from those users (users that the authenticated user is following)
        following_posts = Post.objects.filter(user__in=following_users).order_by('-timestamp')

    # Get all posts ordered by timestamp for the general feed
    posts = Post.objects.all().order_by('-timestamp')
    
    # Get all of the users (members), including their follower and following counts
    all_users = User.objects.all()
    member_data = {}
    for user in all_users:
        member_data[user.id] = {
            'member_username': user.username,
            'member_followers_count': Follow.objects.filter(user=user).count(),
            'member_following_count': Follow.objects.filter(follower=user).count()
        }

    # Render the page with both general posts and following posts
    return render(request, 'network/index.html', {
        'followers_count': followers_count,
        'following_count': following_count,
        'posts': posts,
        'users': all_users,
        'following_users': list(following_users),
        'following_posts': following_posts,
        'member_data': member_data
    })


# For loading posts to each page
def load_posts(request):
    position = int(request.GET.get('offset', 0))
    posts = Post.objects.all().order_by('-timestamp')[position:position+11]

    posts_data = [
        {
            'id': post.id,
            'user_id': post.user.id,
            'user': post.user.username,
            'text': post.text,
            'timestamp': post.timestamp.strftime('%Y-%m-%d, %H:%M'),
            'likes_count': post.likes.count(),
            'liked_by_user': request.user in post.likes.all(),
            'comments': [
                {
                    'user': comment.user.username,
                    'user_id': comment.user.id,
                    'text': comment.text,
                    'timestamp': comment.timestamp.strftime('%Y-%m-%d, %H:%M'),
                } for comment in post.comments.all()
            ]
        } for post in posts
    ]

    # Get the user IDs of the users the current user is following
    following_users = Follow.objects.filter(follower=request.user).values_list('user_id', flat=True)
    
    # Get posts only from the users the current user is following
    following_posts = Post.objects.filter(user__id__in=following_users).order_by('-timestamp')[position:position+11]

    # Prepare following posts data as a list of dictionaries
    following_posts_data = [
        {
            'id': post.id,
            'user_id': post.user.id,
            'user': post.user.username,
            'text': post.text,
            'timestamp': post.timestamp.strftime('%Y-%m-%d, %H:%M'),
            'likes_count': post.likes.count(),
            'liked_by_user': request.user in post.likes.all(),
            'comments': [
                {
                    'user': comment.user.username,
                    'user_id': comment.user.id,
                    'text': comment.text,
                    'timestamp': comment.timestamp.strftime('%Y-%m-%d, %H:%M'),
                } for comment in post.comments.all()
            ]
        } for post in following_posts
    ]

    return JsonResponse({
        'posts': posts_data,
        'following_posts': following_posts_data
    })


# For loading posts to each page relevant to a specific member
def load_member_posts(request, user_id):
    position = int(request.GET.get('offset', 0))
    
    # Get posts from only the member
    member_posts = Post.objects.filter(user=user_id).order_by('-timestamp')[position:position+11]

    # Prepare following posts data as a list of dictionaries
    member_posts_data = [
        {
            'id': post.id,
            'user_id': post.user.id,
            'user': post.user.username,
            'text': post.text,
            'timestamp': post.timestamp.strftime('%Y-%m-%d, %H:%M'),
            'likes_count': post.likes.count(),
            'liked_by_user': request.user in post.likes.all(),
            'comments': [
                {
                    'user': comment.user.username,
                    'user_id': comment.user.id,
                    'text': comment.text,
                    'timestamp': comment.timestamp.strftime('%Y-%m-%d, %H:%M'),
                } for comment in post.comments.all()
            ]
        } for post in member_posts
    ]

    return JsonResponse({
        'member_posts': member_posts_data
    })


# Data for the page of posts from users the current user is following
def follow_data(request):
    if request.user.is_authenticated:
        # Get the user IDs of the users the current user is following
        following_users = Follow.objects.filter(follower=request.user).values_list('user_id', flat=True)

        # Get posts only from the users the current user is following
        following_posts = Post.objects.filter(user__id__in=following_users).order_by('-timestamp').values(
            'id', 'user', 'text', 'timestamp'
        )

        return JsonResponse({'posts': list(following_posts)}, safe=False)
    return JsonResponse({'error': 'Unauthorised'}, status=401)


# Default login view
def login_view(request):
    if request.method == 'POST':

        # Attempt to sign user in
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication was successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('posts:index'))
        else:
            return render(request, 'network/login.html', {
                "message": 'Invalid username and/or password.'
            })
    else:
        return render(request, 'network/login.html')


# Default logout page
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('posts:index'))


# Default registration page
def register(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']

        # Ensure password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'network/register.html', {
                'message': 'Passwords must match.'
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, 'network/register.html', {
                'message': 'Username already taken.'
            })
        login(request, user)
        return HttpResponseRedirect(reverse('posts:index'))
    else:
        return render(request, 'network/register.html')


# Page for submitting new posts
def new_post(request):
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            # Capture all relevant fields
            new_post = form.save(commit=False)
            new_post.user = request.user
            new_post.save()
            return redirect('posts:index')
    else:
        form = PostForm()

    return render(request, 'network/index.html', {'form': form})


# Indicates the data for a post that is to be edited
def edit_data(request, post_id):
    post = Post.objects.filter(id=post_id).first()

    edit_post_data = {
        'id': post.id,
        'user_id': post.user.id,
        'user': post.user.username,
        'text': post.text,
        'timestamp': post.timestamp.strftime('%Y-%m-%d, %H:%M'),
        'likes_count': post.likes.count(),
        'liked_by_user': request.user in post.likes.all(),
        'comments': [
            {
                'user': comment.user.username,
                'user_id': comment.user.id,
                'text': comment.text,
                'timestamp': comment.timestamp.strftime('%Y-%m-%d, %H:%M'),
            } for comment in post.comments.all()
        ]
    }

    return JsonResponse({
        'edit_post_data': edit_post_data
    })


# Passes through the edited post data and updates the post
def edit_post(request, post_id):
    current_user = request.user

    post = Post.objects.filter(id=post_id).first()

    # Don't allow the user to edit if it's not their post
    if post.user_id != current_user.id:
        return JsonResponse({'success': False,
                             'error': 'Permission denied. Unable to edit post.'
        })
    else:
        if request.method == 'POST':
            data = json.loads(request.body)
            updated_text = data.get('text')
            post.text = updated_text
            post.save()

        return JsonResponse({
            'success': True,
            'message': 'Post updated successfully.'
        })


# For creating a new comment
def new_comment(request):
    if request.method == 'POST':
        # Load JSON data from the request body
        try:
            data = json.loads(request.body)
            post_id = data.get('post_id')
            comment_text = data.get('text')

            if not post_id or not comment_text:
                return JsonResponse({'success': False, 'error': 'Missing post_id or comment text.'})

            # Get the Post object related to the post_id
            post = get_object_or_404(Post, id=post_id)

            # Create the new comment
            comment = Comment(user=request.user, post=post, text=comment_text)
            comment.save()

            # Return the new comment data
            return JsonResponse({
                'success': True,
                'comment': {
                    'user': comment.user.username,
                    'user_id': comment.user.id,
                    'text': comment.text,
                    # Timestamp is adjusted appropriately
                    'timestamp': comment.timestamp.strftime('%Y-%m-%d, %H:%M')
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid method.'})


# For liking or unliking a post
def like_post(request, post_id):
    if request.user.is_authenticated:
        user = request.user
    
    # Get the post object
    post = get_object_or_404(Post, id=post_id)
    
    # Check if the user has already liked the post
    if request.user in post.likes.all():
        # If already liked, remove the like
        post.likes.remove(request.user)
    else:
        # If not liked yet, add the like
        post.likes.add(request.user)
    
    # Return a JSON response
    return JsonResponse({
        'success': True,
        'action': 'liked' if request.user in post.likes.all() else 'unliked',
        'likeCount': post.likes.count(),
    })


# Used to follow or unfollow a user
def follow(request, user_id):
    target_user = User.objects.get(id=user_id)
    current_user = request.user

    # Check if the user is already following the other member
    existing_follow = Follow.objects.filter(user=target_user, follower=current_user)

    # Default values for counts
    followers_count = Follow.objects.filter(user=target_user).count()
    following_count = Follow.objects.filter(follower=current_user).count()

    if existing_follow.exists():
        # Unfollow: delete the follow record
        existing_follow.delete()
        action = "unfollowed"
    else:
        # Follow: create a new follow record
        Follow.objects.create(user=target_user, follower=current_user)
        action = "followed"

    # Recalculate counts after the action
    followers_count = Follow.objects.filter(user=target_user).count()
    following_count = Follow.objects.filter(follower=current_user).count()

    return JsonResponse({
        "success": True,
        "followers_count": followers_count,
        "following_count": following_count,
        "action": action
    })


# Provides the profile information for a given member
def profile_info(request, user_id):

    profile_followers_count = Follow.objects.filter(user=user_id).count()
    profile_following_count = Follow.objects.filter(follower=user_id).count()

    # For non-current-user profile pages, indicate whether the user is following them
    user_is_followed = Follow.objects.filter(user=user_id, follower=request.user)

    # Set the button's value to "Follow" initially
    button_value = 'Follow'

    if user_is_followed.exists():
        button_value = 'Unfollow'

    return JsonResponse({
        'success': True,
        'profile_followers_count': profile_followers_count,
        'profile_following_count': profile_following_count,
        'button_value': button_value
    })