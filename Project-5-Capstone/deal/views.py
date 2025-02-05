from django.http import HttpResponse
from django.shortcuts import redirect, render
from .models import Score
import json

# Create your views here.

# When the index page loads, pass through the high scores as well
def index(request):
    scores = Score.objects.all().order_by('-winnings')
    return render(request, 'deal/index.html', {
        'scores': scores
    })


def record_score(request):
    if request.method == "POST":
        username = request.POST.get('username')
        winnings = request.POST.get('winnings')

        if username and winnings:
            # Save score to database
            Score.objects.create(username=username, winnings=int(winnings))
            return redirect('deal:index')
        else:
            return HttpResponse('Invalid data', status=400)
    else:
        return HttpResponse('Invalid request method', status=405)

