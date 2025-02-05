import os, re

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


#The below three functions were present in the original project files
def list_entries():
    """
    Returns a list of all names of encyclopedia entries.
    """
    _, filenames = default_storage.listdir("entries")
    return list(sorted(re.sub(r"\.md$", "", filename)
                for filename in filenames if filename.endswith(".md")))


def save_entry(title, content):
    """
    Saves an encyclopedia entry, given its title and Markdown
    content. If an existing entry with the same title already exists,
    it is replaced.
    """
    filename = f"entries/{title}.md"
    if default_storage.exists(filename):
        default_storage.delete(filename)
    
    # This next line is a change I made, because I want the title to appear at the top of the viewing window
    content_with_title = f"# {title}\n\n{content}"
    
    default_storage.save(filename, ContentFile(content_with_title))


def get_entry(title):
    """
    Retrieves an encyclopedia entry by its title. If no such
    entry exists, the function returns None.
    """
    try:
        f = default_storage.open(f"entries/{title}.md")
        return f.read().decode("utf-8")
    except FileNotFoundError:
        return None


# This function was added later
def delete_entry(title):
    filepath = f"entries/{title}.md"
    if os.path.exists(filepath):
        os.remove(filepath)