import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Email


def index(request):

    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, 'mail/inbox.html')

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse('login'))


@csrf_exempt
@login_required
def compose(request):

    # Composing a new email must be via "POST" to submit the relevant information
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required.'}, status=400)
    
    # Collect all email addresses in the input (multiple email addresses allowed)
    data = json.loads(request.body)
    emails = [email.strip() for email in data.get('recipients').split(',')]

    # Check recipient emails - produce an error alert if the user does not input an email address
    if emails == ['']:
        return JsonResponse({
            'error': 'At least one recipient is required.'
        }, status=400)

    # Convert the email addresses to users
    recipients = []
    for email in emails:
        try:
            user = User.objects.get(email=email)
            recipients.append(user)
        # If the user does not exist, output an alert
        except User.DoesNotExist:
            return JsonResponse({
                'error': f'User with the email {email} does not exist.'
            }, status=400)

    # Get the contents of the email
    subject = data.get('subject', '')
    body = data.get('body', '')

    # Create the email and store the details
    users = set()
    # Add the sender and the recipients to the set to ensure all relevant parties are included
    users.add(request.user)
    users.update(recipients)
    for user in users:
        email = Email(
            user=user,
            sender=request.user,
            subject=subject,
            body=body,
            # Mark that the sender has read the email, but do not mark that the recipients have read it
            read=user == request.user
        )
        email.save()
        for recipient in recipients:
            email.recipients.add(recipient)
        email.save()

    return JsonResponse({'message': 'Email sent successfully.'}, status=201)


@login_required
def mailbox(request, mailbox):

    # Filter emails returned based on mailbox
    if mailbox == 'inbox':
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=False
        )
    elif mailbox == 'sent':
        emails = Email.objects.filter(
            user=request.user, sender=request.user
        )
    elif mailbox == 'archive':
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=True
        )
    else:
        return JsonResponse({'error': 'Invalid mailbox.'}, status=400)

    # Return emails in reverse chronologial order
    emails = emails.order_by('-timestamp').all()
    return JsonResponse([email.serialize() for email in emails], safe=False)


@csrf_exempt
@login_required
def email(request, email_id):

    # Query for requested email
    try:
        email = Email.objects.get(user=request.user, pk=email_id)
    except Email.DoesNotExist:
        return JsonResponse({'error': 'Email not found.'}, status=404)

    # Return email contents
    if request.method == 'GET':
        return JsonResponse(email.serialize())

    # Update whether email is read or should be archived
    elif request.method == 'PUT':
        data = json.loads(request.body)
        if data.get('read') is not None:
            email.read = data['read']
            email.read = True
        if data.get('archived') is not None:
            email.archived = data['archived']
        email.save()
        return HttpResponse(status=204)

    # Email must be via GET or PUT
    else:
        return JsonResponse({
            'error': 'GET or PUT request required.'
        }, status=400)


def update_email(request, email_id):
    if request.method == 'PUT':
        try:
            email = Email.objects.get(pk=email_id)
            data = json.loads(request.body)
            if "read" in data:
                email.read = data['read']
                email.save()
                return JsonResponse({'message': 'Email status updated successfully.'}, status=200)
            else:
                return JsonResponse({'error': 'Invalid data.'}, status=400)
        except Email.DoesNotExist:
            return JsonResponse({'error': 'Email not found.'}, status=404)


def login_view(request):
    if request.method == 'POST':

        # Attempt to sign user in
        email = request.POST['email']
        password = request.POST['password']
        user = authenticate(request, username=email, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('index'))
        else:
            return render(request, 'mail/login.html', {
                'message': 'Invalid email and/or password.'
            })
    else:
        return render(request, 'mail/login.html')


def register(request):
    if request.method == 'POST':
        email = request.POST['email']

        # Ensure password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'mail/register.html', {
                'message': 'Passwords must match.'
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(email, email, password)
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, 'mail/register.html', {
                'message': 'Email address already taken.'
            })
        login(request, user)
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'mail/register.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('index'))