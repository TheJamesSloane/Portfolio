from . import util
from django import forms
from django.shortcuts import render, redirect
from django.utils.html import strip_tags
import markdown
import random


# Generate the form for a new entry
class PageForm(forms.Form):
    title = forms.CharField(label="title")
    content = forms.CharField(
        label="content",
        widget=forms.Textarea
        )


# Should list all entries upon initial load
def index(request):
    return render(request, "encyclopedia/index.html", {
        "titles": util.list_entries()
    })


# Get the page, if it exists
def get_page(request, title):
    page = util.get_entry(title)

    # If the page is not found, present the error page
    if page is None:
        return render(request, "encyclopedia/error.html")
    
    # If the page is found, present the entry page
    clean_title = strip_tags(title)
    return render(request, "encyclopedia/title.html", {
        "title": clean_title,
        "content": markdown.markdown(page)
    })


# Save the information for a new page
def save_page(request):
    if request.method == "POST":
        form = PageForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"]
            content = form.cleaned_data["content"]
            # Before saving, make sure there is no entry with the same title; if there is, return an error message
            existing_titles = util.list_entries()
            if title in existing_titles:
                return render(request, "encyclopedia/new.html", {
                    "form": form,
                    "error": f"A page with the title '{title}' already exists."
                })
            # If there is no error, save the page and direct the user to the page's entry
            util.save_entry(title, content)
            return get_page(request, title)
        else:
            return render(request, "encyclopedia/new.html", {
                "page": page
            })
    return render(request, "encyclopedia/new.html", {
        "form": PageForm()
    })


# Edit a particular page
def edit_page(request, title):
    if request.method == "POST":
        form = PageForm(request.POST)
        if form.is_valid():
            new_title = form.cleaned_data["title"]
            content = form.cleaned_data["content"]
            if title != new_title:
                util.delete_entry(title)
            util.save_entry(new_title, content)
            # Redirect to the updated entry page
            return redirect("wiki:title", title=new_title)
    else:
        page = util.get_entry(title)
        if page:
            content_lines = page.splitlines()
            # Remove the first two lines
            content = "\n".join(content_lines[2:])
            form = PageForm(initial={
                "title": title,
                "content": content
            })
        else:
            return render(request, "encyclopedia/error.html")
    return render(request, "encyclopedia/edit.html", {
        "title": title,
        "form": form
    })


# This will present a random entry's page
def random_page(request):
    titles = util.list_entries()
    title = random.choice(titles)

    page = util.get_entry(title)
    clean_title = strip_tags(title)
    print(title)
    return render(request, "encyclopedia/title.html", {
        "title": clean_title,
        "content": markdown.markdown(page)
    })


# Be able to search for a particular part of an entry
def search(request):
    query = request.GET.get("q", "")
    titles = util.list_entries()
    if query in titles:
        return redirect("wiki:title", title=query)
    results = [title for title in titles if query.lower() in title.lower()]
    return render(request, "encyclopedia/search.html", {
        "query": query,
        "results": results
    })