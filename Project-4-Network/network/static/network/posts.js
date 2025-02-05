document.addEventListener('DOMContentLoaded', function () {

    // LINKS TO ALL PAGES
    // Attach event listeners to the nav links
    document.querySelector('#network-link').addEventListener('click', function (event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        view_section('network-view');
    });
    document.querySelector('#profile-link').addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('profile-load-previous-ten').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        view_section('profile-view');
    });
    document.querySelector('#all-posts-link').addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('load-previous-ten').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        view_section('all-posts-view');
    });
    document.querySelector('#new-posts-link').addEventListener('click', function (event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        view_section('new-post-view');
        document.getElementById('new-post-body').focus();
    });
    document.querySelector('#following-link').addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('follow-load-previous-ten').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        view_section('following-view');
    });

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;


    // PROFILE PAGE

    const profileView = document.getElementById('profile-link');
    const profilePostsContainer = document.querySelector(".profile-posts-container");
    const profileLoadPreviousButton = document.getElementById("profile-load-previous-ten");
    const profileLoadNextButton = document.getElementById("profile-load-next-ten");

    // Automatically set so that the user is on page 1 of the posts
    let profilePageNumber = 1;

    profileView.addEventListener('click', () => {
        profilePageNumber = 1;
        // Make sure the Profile Page is visible
        view_section('profile-view');

        const userData = member_data[currentUserId];

        document.getElementById('profile-username').textContent = userData.member_username;

        // Fetch updated profile information every time the profile page is clicked
        fetch(`/profile_info/${currentUserId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('profile-followers-count').textContent = data.profile_followers_count;
                    document.getElementById('profile-following-count').textContent = data.profile_following_count;
                } else {
                    console.error('Error:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });

        // Fetch the latest posts every time the profile page is opened
        fetch(`/load_member_posts/${currentUserId}?offset=0&limit=10`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
            .then(response => response.json())
            .then(data => {
                profilePostsContainer.innerHTML = "";

                if (data.member_posts.length === 0) {
                    const postElement = document.createElement('div');
                    postElement.innerHTML = `You have not posted yet.`;
                    profilePostsContainer.appendChild(postElement);
                    profileLoadNextButton.style.display = 'none';
                } else {
                    profileLoadNextButton.style.display = 'block';

                    data.member_posts.slice(0, 10).forEach(post => {
                        const postBox = document.createElement('div');
                        postBox.classList.add('box');
                        postBox.setAttribute('data-profile-post-id', post.id);

                        postBox.innerHTML = `
                    <div class="post-box">
                        <strong>
                            <a href="#" class="username-link" data-member="${post.user_id}">
                                ${post.user}
                            </a>
                        </strong> | ${post.timestamp}
                        <p>${post.text}</p>
                        Likes: <span class="like-count">${post.likes_count}</span>
                        <br>
                        <button class='like-unlike-button' data-profile-post-id='${post.id}'>
                            ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                        </button>
                        <div class="edit-post">
                            ${post.user_id === Number(currentUserId) ?
                                `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                                : ''
                            }
                        </div>
                    </div>
                    <div class="comments">
                        <h5>Comments:</h5>
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <strong>
                                    <a href="#" class="username-link" data-member="${comment.user_id}">
                                        ${comment.user}
                                    </a>
                                </strong> | ${comment.timestamp}
                                <p>${comment.text}</p>
                            </div>
                        `).join("") || "<p>No comments yet.</p>"}
                        <textarea class="new-post-control" id="profile-post-comment" name="text" placeholder="Add commentary"></textarea>
                        <br>
                        <input type="submit" class="comment-submit-button" profile-comment-post-id="${post.id}" value="Comment">
                    </div>
                `;

                        // Handle button visibility
                        if (data.member_posts.length < 11) {
                            profileLoadNextButton.style.display = 'none';
                        } else {
                            profileLoadNextButton.style.display = 'block';
                        }
                        profilePostsContainer.appendChild(postBox);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
            });
    });


    // Update (dynamically) whether a post is liked

    document.querySelector('.profile-posts-container').addEventListener('click', function (event) {
        if (event.target.classList.contains('like-unlike-button')) {
            const button = event.target;
            const postId = button.getAttribute('data-profile-post-id');

            fetch(`/like/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update button text
                        button.textContent = data.action === 'liked' ? '👍 Liked' : '👍 Like';

                        // Update the like count dynamically
                        const likeCount = button.closest('.post-box').querySelector('.like-count');
                        likeCount.textContent = data.likeCount;
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });


    // General: If you try to target specific attributes, such as buttons, then that will work only for buttons originally generated - it won't work for those generated using JavaScript
    // Tip: Target the div instead, because JavaScript will generate new buttons within it

    document.querySelector('.profile-posts-container').addEventListener('click', function (event) {
        // Check if the clicked element is a comment submit button
        if (event.target.classList.contains('comment-submit-button')) {
            const button = event.target;
            const postId = button.getAttribute('profile-comment-post-id');

            // Find the associated textarea within the closest comments container
            const commentsContainer = button.closest('.comments');
            const commentText = commentsContainer.querySelector('textarea.new-post-control').value;

            // Check if comment text is provided
            if (!commentText) {
                alert('Please enter a comment.');
                return;
            }

            // Send comment data to the server
            fetch('/new_comment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    text: commentText,
                    post_id: postId
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Clear the textarea after posting the comment
                        commentsContainer.querySelector('textarea.new-post-control').value = '';

                        // Dynamically add the new comment to the top of the comments list
                        const noCommentsPlaceholder = commentsContainer.querySelector('p');
                        if (noCommentsPlaceholder && noCommentsPlaceholder.textContent === 'No comments yet.') {
                            noCommentsPlaceholder.remove();
                        }

                        // Create and add the new comment element
                        const newComment = document.createElement('div');
                        newComment.classList.add('comment');
                        newComment.innerHTML = `
            <strong>
                <a href="#" class="username-link" data-member="${data.comment.user_id}">
                    ${data.comment.user}
                </a>
            </strong> | ${data.comment.timestamp}
            <p>${data.comment.text}</p>`;
                        // Insert the new comment before the textarea
                        const textarea = commentsContainer.querySelector('#profile-post-comment');
                        commentsContainer.insertBefore(newComment, textarea.closest('textarea'));
                    } else {
                        console.error('Error posting comment:', data.error);
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });


    // Load the previous ten posts (if they exist)
    profileLoadPreviousButton.addEventListener('click', () => {
        // Update the page number appropriately
        profilePageNumber -= 1;

        // If the user is on the first page, the "Load Previous" button should disappear
        if (profilePageNumber === 1) {
            profileLoadPreviousButton.style.display = 'none';
        }

        // Calculate the current offset for the fetch request
        const currentPosition = (profilePageNumber - 1) * 10;

        fetch(`/load_member_posts/${currentUserId}?offset=${currentPosition}`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                profilePostsContainer.innerHTML = '';

                // Create new elements for each subsequent post
                data.member_posts.slice(0, 10).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'box';
                    postElement.setAttribute('data-profile-post-id', post.id);
                    postElement.innerHTML = `
                    <div class="post-box">
                        <strong>
                            <a href="#" class="username-link" data-member="${post.user_id}">
                                ${post.user}
                            </a>
                        </strong> | ${post.timestamp}
                        <p>${post.text}</p>
                        Likes: <span class="like-count">${post.likes_count}</span>
                        <br>
                        <button class="like-unlike-button" data-profile-post-id="${post.id}">
                            👍 Like
                        </button>
                        <div class="edit-post">
                            ${post.user_id === Number(currentUserId) ?
                            `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                            : ''
                        }
                        </div>
                    </div>
                    <div class="comments">
                        <h5>Comments:</h5>
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <strong>
                                    <a href="#" class="username-link" data-member="${comment.user_id}">
                                        ${comment.user}
                                    </a>
                                </strong> | ${comment.timestamp}
                                <p>${comment.text}</p>
                            </div>
                        `).join("") || "<p>No comments yet.</p>"}
                        <textarea class="new-post-control" id="profile-post-comment" name="text" placeholder="Add commentary"></textarea>
                        <br>
                        <input type="submit" class="comment-submit-button" profile-comment-post-id="${post.id}" value="Comment">
                    </div>
                `;
                    profilePostsContainer.appendChild(postElement);
                });

                // Scroll to the top of the posts container
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Update the loaded count
                profileLoadNextButton.setAttribute('data-profile-posts-loaded', currentPosition);

                // Show the "Load Next" button if it was previously hidden
                profileLoadNextButton.style.display = 'block';

            })
            .catch(error => console.error('Error loading previous posts:', error));
    });


    // Load the next ten posts (if they exist)
    profileLoadNextButton.addEventListener('click', () => {
        // Increment the page number to determine the next offset
        profilePageNumber += 1;

        // Fetch posts based on the current page number
        fetch(`/load_member_posts/${currentUserId}?offset=${(profilePageNumber - 1) * 10}`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                profilePostsContainer.innerHTML = '';

                // Create new elements for each post in the batch
                data.member_posts.slice(0, 10).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'box';
                    postElement.setAttribute('data-profile-post-id', post.id);
                    postElement.innerHTML = `
                    <div class="post-box">
                        <strong>
                            <a href="#" class="username-link" data-member="${post.user_id}">
                                ${post.user}
                            </a>
                        </strong> | ${post.timestamp}
                        <p>${post.text}</p>
                        Likes: <span class="like-count">${post.likes_count}</span>
                        <br>
                        <button class="like-unlike-button" data-profile-post-id="${post.id}">
                            👍 Like
                        </button>
                        <div class="edit-post">
                            ${post.user_id === Number(currentUserId) ?
                            `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                            : ''
                        }
                        </div>
                    </div>
                    <div class="comments">
                        <h5>Comments:</h5>
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <strong>
                                    <a href="#" class="username-link" data-member="${comment.user_id}">
                                        ${comment.user}
                                    </a>
                                </strong> | ${comment.timestamp}
                                <p>${comment.text}</p>
                            </div>
                        `).join("") || "<p>No comments yet.</p>"}
                        <textarea class="new-post-control" id="profile-post-comment" name="text" placeholder="Add commentary"></textarea>
                        <br>
                        <input type="submit" class="comment-submit-button" profile-comment-post-id="${post.id}" value="Comment">
                    </div>
                `;
                    profilePostsContainer.appendChild(postElement);
                });

                // Scroll to the top of the posts container
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Handle button visibility
                // Always show "Load Previous" after navigating forward
                profileLoadPreviousButton.style.display = 'block';
                // Hide "Load Next" if fewer than 10 posts are returned
                if (data.member_posts.length < 11) {
                    profileLoadNextButton.style.display = 'none';
                }
            })
            .catch(error => console.error('Error loading more posts:', error));
    });


    // ALL POSTS PAGE

    const allPostsView = document.getElementById('all-posts-link');
    const loadPreviousButton = document.getElementById('load-previous-ten');
    const loadNextButton = document.getElementById('load-next-ten');
    const postsContainer = document.querySelector('.posts-container');

    // Automatically set so that the user is on page 1 of the posts
    let pageNumber = 1;

    // Load the first ten posts
    allPostsView.addEventListener('click', () => {
        pageNumber = 1;
        // Initially load the posts
        fetch(`/load_posts?offset=0&limit=10`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                postsContainer.innerHTML = '';

                // Message for if there are no posts to display
                if (data.posts.length === 0) {
                    const postElement = document.createElement('div');
                    postElement.innerHTML = `
                        No posts to display.
                    `
                    postsContainer.appendChild(postElement)
                    loadNextButton.style.display = 'none';
                } else {
                    // Create new elements for each subsequent post
                    data.posts.slice(0, 10).forEach(post => {
                        const postElement = document.createElement('div');
                        postElement.className = 'box';
                        postElement.setAttribute('data-post-id', post.id);
                        postElement.innerHTML = `
                            <div class='post-box'>
                                <strong>
                                    <a href="#" class="username-link" data-member="${post.user_id}">
                                        ${post.user}
                                    </a>
                                </strong> | ${post.timestamp}
                                <p>${post.text}</p>
                                Likes: <span class='like-count'>${post.likes_count}</span>
                                <br>
                                <button class='like-unlike-button' data-post-id='${post.id}'>
                                    ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                                </button>
                                <div class="edit-post">
                                    ${post.user_id === Number(currentUserId) ?
                                `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                                : ''
                            }
                                </div>
                            </div>
                            <div class='comments'>
                                <h5>Comments:</h5>
                                ${post.comments.length > 0 ? post.comments.map(comment => `
                                    <div class='comment'>
                                        <strong>
                                            <a href="#" class="username-link" data-member="${comment.user_id}">
                                                ${comment.user}
                                            </a>
                                        </strong> | ${comment.timestamp}
                                        <p>${comment.text}</p>
                                    </div>`).join('') : '<p>No comments yet.</p>'}
                                <textarea class='new-post-control' id='post-comment' name='text' placeholder='Add commentary'></textarea>
                                <br>
                                <input type='submit' class='comment-submit-button' comment-post-id='${post.id}' value='Comment'>
                            </div>
                        `;
                        postsContainer.appendChild(postElement);
                    });

                    // Scroll to the top of the posts container
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    // Handle button visibility
                    loadNextButton.style.display = 'block';
                    // Hide "Load Next" if fewer than 10 posts are returned
                    if (data.posts.length < 11) {
                        loadNextButton.style.display = 'none';
                    }

                    // Set the current post count
                    loadNextButton.setAttribute('data-posts-loaded', 10);
                }
            })
            .catch(error => console.error('Error loading posts:', error));

    });


    // Update (dynamically) whether a post is liked

    document.querySelector('.posts-container').addEventListener('click', function (event) {

        if (event.target.classList.contains('like-unlike-button')) {
            const button = event.target;
            const postId = button.getAttribute('data-post-id');

            fetch(`/like/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update button text
                        button.textContent = data.action === 'liked' ? '👍 Liked' : '👍 Like';

                        // Update the like count dynamically
                        const likeCount = button.closest('.post-box').querySelector('.like-count');
                        likeCount.textContent = data.likeCount;
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });


    // General: If you try to target specific attributes, such as buttons, then that will work only for buttons originally generated - it won't work for those generated using JavaScript
    // Tip: Target the div instead, because JavaScript will generate new buttons within it

    document.querySelector('.posts-container').addEventListener('click', function (event) {
        // Check if the clicked element is a comment submit button
        if (event.target.classList.contains('comment-submit-button')) {
            const button = event.target;
            const postId = button.getAttribute('comment-post-id');

            // Find the associated textarea within the closest comments container
            const commentsContainer = button.closest('.comments');
            const commentText = commentsContainer.querySelector('textarea.new-post-control').value;

            // Check if comment text is provided
            if (!commentText) {
                alert('Please enter a comment.');
                return;
            }

            // Send comment data to the server
            fetch('/new_comment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    text: commentText,
                    post_id: postId
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Clear the textarea after posting the comment
                        commentsContainer.querySelector('textarea.new-post-control').value = '';

                        // Dynamically add the new comment to the top of the comments list
                        const noCommentsPlaceholder = commentsContainer.querySelector('p');
                        if (noCommentsPlaceholder && noCommentsPlaceholder.textContent === 'No comments yet.') {
                            noCommentsPlaceholder.remove();
                        }

                        // Create and add the new comment element
                        const newComment = document.createElement('div');
                        newComment.classList.add('comment');
                        newComment.innerHTML = `
                        <strong>
                            <a href="#" class="username-link" data-member="${data.comment.user_id}">
                                ${data.comment.user}
                            </a>
                        </strong> | ${data.comment.timestamp}
                        <p>${data.comment.text}</p>`;

                        // Insert the new comment before the textarea
                        const textarea = commentsContainer.querySelector('#post-comment');
                        commentsContainer.insertBefore(newComment, textarea.closest('textarea'));
                    } else {
                        console.error('Error posting comment:', data.error);
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });


    // Load the previous ten posts (if they exist)
    loadPreviousButton.addEventListener('click', () => {
        // Update the page number appropriately
        pageNumber -= 1;

        // If the user is on the first page, the "Load Previous" button should disappear
        if (pageNumber === 1) {
            loadPreviousButton.style.display = 'none';
        }

        // Calculate the current offset for the fetch request
        const currentPosition = (pageNumber - 1) * 10;

        fetch(`/load_posts?offset=${currentPosition}`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                postsContainer.innerHTML = '';

                // Create new elements for each subsequent post
                data.posts.slice(0, 10).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'box';
                    postElement.setAttribute('data-post-id', post.id);
                    postElement.innerHTML = `
                        <div class='post-box'>
                            <strong>
                                <a href="#" class="username-link" data-member="${post.user_id}">
                                    ${post.user}
                                </a>
                            </strong> | ${post.timestamp}
                            <p>${post.text}</p>
                            Likes: <span class='like-count'>${post.likes_count}</span>
                            <br>
                            <button class='like-unlike-button' data-post-id='${post.id}'>
                                ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                            </button>
                            <div class="edit-post">
                                ${post.user_id === Number(currentUserId) ?
                            `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                            : ''
                        }
                            </div>
                        </div>
                        <div class='comments'>
                            <h5>Comments:</h5>
                            ${post.comments.length > 0 ? post.comments.map(comment => `
                                <div class='comment'>
                                    <strong>
                                            <a href="#" class="username-link" data-member="${comment.user_id}">
                                                ${comment.user}
                                            </a>
                                        </strong> | ${comment.timestamp}
                                    <p>${comment.text}</p>
                                </div>`).join('') : '<p>No comments yet.</p>'}
                            <textarea class='new-post-control' id='post-comment' name='text' placeholder='Add commentary'></textarea>
                            <br>
                            <input type='submit' class='comment-submit-button' comment-post-id='${post.id}' value='Comment'>
                        </div>
                    `;
                    postsContainer.appendChild(postElement);
                });

                // Scroll to the top of the posts container
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Update the loaded count
                loadNextButton.setAttribute('data-posts-loaded', currentPosition);

                // Show the "Load Next" button if it was previously hidden
                loadNextButton.style.display = 'block';

            })
            .catch(error => console.error('Error loading previous posts:', error));
    });


    // Load the next ten posts (if they exist)
    loadNextButton.addEventListener('click', () => {
        // Increment the page number to determine the next offset
        pageNumber += 1;

        // Fetch posts based on the current page number
        fetch(`/load_posts?offset=${(pageNumber - 1) * 10}`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                postsContainer.innerHTML = '';

                // Create new elements for each post in the batch
                data.posts.slice(0, 10).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'box';
                    postElement.setAttribute('data-post-id', post.id);
                    postElement.innerHTML = `
                        <div class='post-box'>
                            <strong>
                                <a href="#" class="username-link" data-member="${post.user_id}">
                                    ${post.user}
                                </a>
                            </strong> | ${post.timestamp}
                            <p>${post.text}</p>
                            Likes: <span class='like-count'>${post.likes_count}</span>
                            <br>
                            <button class='like-unlike-button' data-post-id='${post.id}'>
                                ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                            </button>
                            <div class="edit-post">
                                ${post.user_id === Number(currentUserId) ?
                            `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                            : ''
                        }
                            </div>
                        </div>
                        <div class='comments'>
                            <h5>Comments:</h5>
                            ${post.comments.length > 0 ? post.comments.map(comment => `
                                <div class='comment'>
                                    <strong>
                                        <a href="#" class="username-link" data-member="${comment.user_id}">
                                            ${comment.user}
                                        </a>
                                    </strong> | ${comment.timestamp}
                                    <p>${comment.text}</p>
                                </div>`).join('') : '<p>No comments yet.</p>'}
                            <textarea class='new-post-control' id='post-comment' name='text' placeholder='Add commentary'></textarea>
                            <br>
                            <input type='submit' class='comment-submit-button' comment-post-id='${post.id}' value='Comment'>
                        </div>
                    `;
                    postsContainer.appendChild(postElement);
                });

                // Scroll to the top of the posts container
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Handle button visibility
                // Always show "Load Previous" after navigating forward
                loadPreviousButton.style.display = 'block';
                // Hide "Load Next" if fewer than 10 posts are returned
                if (data.posts.length < 11) {
                    loadNextButton.style.display = 'none';
                }
            })
            .catch(error => console.error('Error loading more posts:', error));
    });


    // MEMBER PROFILE PAGE

    const memberPostsContainer = document.querySelector(".member-posts-container");
    const memberLoadPreviousButton = document.getElementById("member-load-previous-ten");
    const memberLoadNextButton = document.getElementById("member-load-next-ten");

    // Automatically set so that the user is on page 1 of the posts
    let memberPageNumber = 1;

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('username-link')) {
            event.preventDefault();
            memberPageNumber = 1;
            memberLoadPreviousButton.style.display = 'none';

            // Get the user ID from the link's data attribute
            const memberId = event.target.getAttribute('data-member');

            // If the user views another user's profile, load the profile page of that user; otherwise, load the user's profile page
            if (memberId != currentUserId) {
                view_section('member-profile-view');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Access the data for the specific member whose profile is being viewed
                const userData = member_data[memberId];

                // Update the profile section with the user data
                document.getElementById('member-username').textContent = userData.member_username;

                fetch(`/profile_info/${memberId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            document.getElementById('member-followers-count').textContent = data.profile_followers_count;
                            document.getElementById('member-following-count').textContent = data.profile_following_count;
                            const isFollowing = data.button_value;
                            const postElement = document.getElementById('member-follow-unfollow-button');
                            postElement.innerHTML = `
                            <button class="follow-unfollow-button" data-user-id="${memberId}">
                                ${data.button_value}
                            </button>
                        `;

                            // Rebind the follow/unfollow button click event
                            document.querySelectorAll('.follow-unfollow-button').forEach(button => {
                                button.addEventListener('click', function () {
                                    const action = this.textContent.toLowerCase();

                                    fetch(`/follow/${memberId}`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRFToken': csrfToken
                                        },
                                        body: JSON.stringify({ action })
                                    })
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.success) {
                                                // Update button text
                                                this.textContent = data.action === 'followed' ? 'Unfollow' : 'Follow';

                                                // Update the follower count dynamically
                                                const followersCountElement = document.querySelector('#member-followers-count');
                                                followersCountElement.textContent = data.followers_count;
                                            }
                                        })
                                        .catch(error => console.error('Fetch error:', error));
                                });
                            });
                        } else {
                            console.error('Error:', data.message);
                        }
                    })

                fetch(`/load_member_posts/${memberId}?offset=0&limit=10`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        // Clear the existing posts before adding the new batch

                        memberPostsContainer.innerHTML = "";

                        if (data.member_posts.length === 0) {
                            const postElement = document.createElement('div');
                            postElement.innerHTML = `
                            No posts from this user.
                        `;
                            memberPostsContainer.appendChild(postElement);
                            memberLoadNextButton.style.display = 'none';
                        } else {
                            memberLoadNextButton.style.display = 'block';

                            data.member_posts.slice(0, 10).forEach(post => {
                                const postBox = document.createElement('div');
                                postBox.classList.add('box');
                                postBox.setAttribute('data-member-post-id', post.id);

                                postBox.innerHTML = `
                                <div class="post-box">
                                    <strong>
                                        <a href="#" class="username-link" data-member="${post.user_id}">
                                            ${post.user}
                                        </a>
                                    </strong> | ${post.timestamp}
                                    <p>${post.text}</p>
                                    Likes: <span class="like-count">${post.likes_count}</span>
                                    <br>
                                    <button class="like-unlike-button" data-member-post-id="${post.id}">
                                        👍 Like
                                    </button>
                                    <div class="edit-post">
                                        ${post.user_id === Number(currentUserId) ?
                                        `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                                        : ''
                                    }
                                    </div>
                                </div>
                                <div class="comments">
                                    <h5>Comments:</h5>
                                    ${post.comments.map(comment => `
                                        <div class="comment">
                                            <strong>
                                                <a href="#" class="username-link" data-member="${comment.user_id}">
                                                    ${comment.user}
                                                </a>
                                            </strong> | ${comment.timestamp}
                                            <p>${comment.text}</p>
                                        </div>
                                    `).join("") || "<p>No comments yet.</p>"}
                                    <textarea class="new-post-control" id="member-post-comment" name="text" placeholder="Add commentary"></textarea>
                                    <br>
                                    <input type="submit" class="comment-submit-button" member-comment-post-id="${post.id}" value="Comment">
                                </div>
                            `;
                                memberPostsContainer.appendChild(postBox);
                            });
                        }
                    });

                // Update (dynamically) whether a post is liked

                document.querySelector('.member-posts-container').addEventListener('click', function (event) {
                    if (event.target.classList.contains('like-unlike-button')) {
                        const button = event.target;
                        const postId = button.getAttribute('data-member-post-id');

                        fetch(`/like/${postId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            }
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Update button text
                                    button.textContent = data.action === 'liked' ? '👍 Liked' : '👍 Like';

                                    // Update the like count dynamically
                                    const likeCount = button.closest('.post-box').querySelector('.like-count');
                                    likeCount.textContent = data.likeCount;
                                }
                            })
                            .catch(error => console.error('Fetch error:', error));
                    }
                });

                // General: If you try to target specific attributes, such as buttons, then that will work only for buttons originally generated - it won't work for those generated using JavaScript
                // Tip: Target the div instead, because JavaScript will generate new buttons within it

                document.querySelector('.member-posts-container').addEventListener('click', function (event) {
                    // Check if the clicked element is a comment submit button
                    if (event.target.classList.contains('comment-submit-button')) {
                        const button = event.target;
                        const postId = button.getAttribute('member-comment-post-id');

                        // Find the associated textarea within the closest comments container
                        const commentsContainer = button.closest('.comments');
                        const commentText = commentsContainer.querySelector('textarea.new-post-control').value;

                        // Check if comment text is provided
                        if (!commentText) {
                            alert('Please enter a comment.');
                            return;
                        }

                        // Send comment data to the server
                        fetch('/new_comment/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            },
                            body: JSON.stringify({
                                text: commentText,
                                post_id: postId
                            })
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Clear the textarea after posting the comment
                                    commentsContainer.querySelector('textarea.new-post-control').value = '';

                                    // Dynamically add the new comment to the top of the comments list
                                    const noCommentsPlaceholder = commentsContainer.querySelector('p');
                                    if (noCommentsPlaceholder && noCommentsPlaceholder.textContent === 'No comments yet.') {
                                        noCommentsPlaceholder.remove();
                                    }

                                    // Create and add the new comment element
                                    const newComment = document.createElement('div');
                                    newComment.classList.add('comment');
                                    newComment.innerHTML = ` 
                        <strong>
                            <a href="#" class="username-link" data-member="${data.comment.user_id}">
                                ${data.comment.user}
                            </a>
                        </strong> | ${data.comment.timestamp}
                        <p>${data.comment.text}</p>`;
                                    // Insert the new comment before the textarea
                                    const textarea = commentsContainer.querySelector('#member-post-comment');
                                    commentsContainer.insertBefore(newComment, textarea.closest('textarea'));
                                } else {
                                    console.error('Error posting comment:', data.error);
                                }
                            })
                            .catch(error => console.error('Fetch error:', error));
                    }
                });


                // Load the previous ten posts (if they exist)
                memberLoadPreviousButton.addEventListener('click', () => {
                    // Update the page number appropriately
                    memberPageNumber -= 1;

                    // If the user is on the first page, the "Load Previous" button should disappear
                    if (memberPageNumber === 1) {
                        memberLoadPreviousButton.style.display = 'none';
                    }

                    // Calculate the current offset for the fetch request
                    const currentPosition = (memberPageNumber - 1) * 10;

                    fetch(`/load_member_posts/${memberId}?offset=${currentPosition}`)
                        .then(response => response.json())
                        .then(data => {
                            // Clear the existing posts before adding the new batch
                            memberPostsContainer.innerHTML = '';

                            // Create new elements for each subsequent post
                            data.member_posts.slice(0, 10).forEach(post => {
                                const postElement = document.createElement('div');
                                postElement.className = 'box';
                                postElement.setAttribute('data-member-post-id', post.id);
                                postElement.innerHTML = `
                                <div class="post-box">
                                    <strong>
                                        <a href="#" class="username-link" data-member="${post.user_id}">
                                            ${post.user}
                                        </a>
                                    </strong> | ${post.timestamp}
                                    <p>${post.text}</p>
                                    Likes: <span class="like-count">${post.likes_count}</span>
                                    <br>
                                    <button class="like-unlike-button" data-member-post-id="${post.id}">
                                        👍 Like
                                    </button>
                                    <div class="edit-post">
                                        ${post.user_id === Number(currentUserId) ?
                                        `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                                        : ''
                                    }
                                    </div>
                                </div>
                                <div class="comments">
                                    <h5>Comments:</h5>
                                    ${post.comments.map(comment => `
                                        <div class="comment">
                                            <strong>
                                                <a href="#" class="username-link" data-member="${comment.user_id}">
                                                    ${comment.user}
                                                </a>
                                            </strong> | ${comment.timestamp}
                                            <p>${comment.text}</p>
                                        </div>
                                    `).join("") || "<p>No comments yet.</p>"}
                                    <textarea class="new-post-control" id="member-post-comment" name="text" placeholder="Add commentary"></textarea>
                                    <br>
                                    <input type="submit" class="comment-submit-button" member-comment-post-id="${post.id}" value="Comment">
                                </div>
                            `;
                                memberPostsContainer.appendChild(postElement);
                            });

                            // Scroll to the top of the posts container
                            window.scrollTo({ top: 0, behavior: 'smooth' });

                            // Update the loaded count
                            memberLoadNextButton.setAttribute('data-member-posts-loaded', currentPosition);

                            // Show the "Load Next" button if it was previously hidden
                            memberLoadNextButton.style.display = 'block';

                        })
                        .catch(error => console.error('Error loading previous posts:', error));
                });

                // Load the next ten posts (if they exist)
                memberLoadNextButton.addEventListener('click', () => {
                    // Increment the page number to determine the next offset
                    memberPageNumber += 1;

                    // Fetch posts based on the current page number
                    fetch(`/load_member_posts/${memberId}?offset=${(memberPageNumber - 1) * 10}`)
                        .then(response => response.json())
                        .then(data => {
                            // Clear the existing posts before adding the new batch
                            memberPostsContainer.innerHTML = '';

                            // Create new elements for each post in the batch
                            data.member_posts.slice(0, 10).forEach(post => {
                                const postElement = document.createElement('div');
                                postElement.className = 'box';
                                postElement.setAttribute('data-member-post-id', post.id);
                                postElement.innerHTML = `
                                <div class="post-box">
                                    <strong>
                                        <a href="#" class="username-link" data-member="${post.user_id}">
                                            ${post.user}
                                        </a>
                                    </strong> | ${post.timestamp}
                                    <p>${post.text}</p>
                                    Likes: <span class="like-count">${post.likes_count}</span>
                                    <br>
                                    <button class="like-unlike-button" data-member-post-id="${post.id}">
                                        👍 Like
                                    </button>
                                    <div class="edit-post">
                                        ${post.user_id === Number(currentUserId) ?
                                        `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                                        : ''
                                    }
                                    </div>
                                </div>
                                <div class="comments">
                                    <h5>Comments:</h5>
                                    ${post.comments.map(comment => `
                                        <div class="comment">
                                            <strong>
                                                <a href="#" class="username-link" data-member="${comment.user_id}">
                                                    ${comment.user}
                                                </a>
                                            </strong> | ${comment.timestamp}
                                            <p>${comment.text}</p>
                                        </div>
                                    `).join("") || "<p>No comments yet.</p>"}
                                    <textarea class="new-post-control" id="member-post-comment" name="text" placeholder="Add commentary"></textarea>
                                    <br>
                                    <input type="submit" class="comment-submit-button" member-comment-post-id="${post.id}" value="Comment">
                                </div>
                            `;
                                memberPostsContainer.appendChild(postElement);
                            });

                            // Scroll to the top of the posts container
                            window.scrollTo({ top: 0, behavior: 'smooth' });

                            // Handle button visibility
                            // Always show "Load Previous" after navigating forward
                            memberLoadPreviousButton.style.display = 'block';
                            // Hide "Load Next" if fewer than 10 posts are returned
                            if (data.member_posts.length < 11) {
                                memberLoadNextButton.style.display = 'none';
                            }
                        })
                        .catch(error => console.error('Error loading more posts:', error));
                });

            } else {
                view_section('profile-view');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                const userData = member_data[currentUserId];

                document.getElementById('profile-username').textContent = userData.member_username;

                fetch(`/profile_info/${currentUserId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            document.getElementById('profile-followers-count').textContent = data.profile_followers_count;
                            document.getElementById('profile-following-count').textContent = data.profile_following_count;
                        } else {
                            console.error('Error:', data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            }
        }
    });


    // FOLLOWING PAGE

    const followingView = document.getElementById('following-link');
    const followLoadPreviousButton = document.getElementById('follow-load-previous-ten');
    const followLoadNextButton = document.getElementById('follow-load-next-ten');
    const followPostsContainer = document.querySelector('.follow-posts-container');
    
    // Automatically set so that the user is on page 1 of the posts
    let followPageNumber = 1;

    // Load the first ten posts
    followingView.addEventListener('click', () => {
        followPageNumber = 1;
        // Initially load the posts
        fetch(`/load_posts?offset=0&limit=10`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                followPostsContainer.innerHTML = '';

                // Message for if there are no posts to display
                if (data.following_posts.length === 0) {
                    const postElement = document.createElement('div');
                    postElement.innerHTML = `
                        No posts from users you're following.
                    `
                    followPostsContainer.appendChild(postElement)
                    followLoadNextButton.style.display = 'none';
                } else {
                    // Create new elements for each post from the users the current user is following
                    data.following_posts.slice(0, 10).forEach(post => {
                        const postElement = document.createElement('div');
                        postElement.className = 'box';
                        postElement.setAttribute('data-follow-post-id', post.id);
                        postElement.innerHTML = `
                            <div class='post-box'>
                                <strong>
                                    <a href="#" class="username-link" data-member="${post.user_id}">
                                        ${post.user}
                                    </a>
                                </strong> | ${post.timestamp}
                                <p>${post.text}</p>
                                Likes: <span class='like-count'>${post.likes_count}</span>
                                <br>
                                <button class='like-unlike-button' data-follow-post-id='${post.id}'>
                                    ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                                </button>
                                <div class="edit-post">
                                    ${post.user_id === Number(currentUserId) ?
                                `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                                : ''
                            }
                                </div>
                            </div>
                            <div class='comments'>
                                <h5>Comments:</h5>
                                ${post.comments.length > 0 ? post.comments.map(comment => `
                                    <div class='comment'>
                                        <strong>
                                            <a href="#" class="username-link" data-member="${comment.user_id}">
                                                ${comment.user}
                                            </a>
                                        </strong> | ${comment.timestamp}
                                        <p>${comment.text}</p>
                                    </div>`).join('') : '<p>No comments yet.</p>'}
                                <textarea class='new-post-control' id='follow-post-comment' name='text' placeholder='Add commentary'></textarea>
                                <br>
                                <input type='submit' class='comment-submit-button' follow-comment-post-id='${post.id}' value='Comment'>
                            </div>
                        `;
                        followPostsContainer.appendChild(postElement);
                    });

                    // Scroll to the top of the posts container
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    // Show the "Load Next" button if it was previously hidden
                    followLoadNextButton.style.display = 'block';
                    if (data.following_posts.length < 11) {
                        followLoadNextButton.style.display = 'none';
                    }

                    // Set the current post count
                    followLoadNextButton.setAttribute('data-follow-posts-loaded', 10);
                }
            })
            .catch(error => console.error('Error loading posts:', error));
    });

    // Update (dynamically) whether a post is liked

    document.querySelector('.follow-posts-container').addEventListener('click', function (event) {
        if (event.target.classList.contains('like-unlike-button')) {
            let button = event.target;
            let postId = button.getAttribute('data-follow-post-id');

            fetch(`/like/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update button text
                        button.textContent = data.action === 'liked' ? '👍 Liked' : '👍 Like';

                        // Update the like count dynamically
                        const likeCount = button.closest('.post-box').querySelector('.like-count');
                        likeCount.textContent = data.likeCount;
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });


    // General: If you try to target specific attributes, such as buttons, then that will work only for buttons originally generated - it won't work for those generated using JavaScript
    // Tip: Target the div instead, because JavaScript will generate new buttons within it

    document.querySelector('.follow-posts-container').addEventListener('click', function (event) {
        // Check if the clicked element is a comment submit button
        if (event.target.classList.contains('comment-submit-button')) {
            const button = event.target;
            const postId = button.getAttribute('follow-comment-post-id');

            // Find the associated textarea within the closest comments container
            const commentsContainer = button.closest('.comments');
            const commentText = commentsContainer.querySelector('textarea.new-post-control').value;

            // Check if comment text is provided
            if (!commentText) {
                alert('Please enter a comment.');
                return;
            }

            // Send comment data to the server
            fetch('/new_comment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    text: commentText,
                    post_id: postId
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Clear the textarea after posting the comment
                        commentsContainer.querySelector('textarea.new-post-control').value = '';

                        // Dynamically add the new comment to the top of the comments list
                        const noCommentsPlaceholder = commentsContainer.querySelector('p');
                        if (noCommentsPlaceholder && noCommentsPlaceholder.textContent === 'No comments yet.') {
                            noCommentsPlaceholder.remove();
                        }

                        // Create and add the new comment element
                        const newComment = document.createElement('div');
                        newComment.classList.add('comment');
                        newComment.innerHTML = ` 
                        <strong>
                            <a href="#" class="username-link" data-member="${data.comment.user_id}">
                                ${data.comment.user}
                            </a>
                        </strong> | ${data.comment.timestamp}
                        <p>${data.comment.text}</p>`;
                        // Insert the new comment before the textarea
                        const textarea = commentsContainer.querySelector('#follow-post-comment');
                        commentsContainer.insertBefore(newComment, textarea.closest('textarea'));
                    } else {
                        console.error('Error posting comment:', data.error);
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });


    // Load the previous ten posts (if they exist)
    followLoadPreviousButton.addEventListener('click', () => {
        // Update the page number appropriately
        followPageNumber -= 1;

        // If the user is on the first page, the "Load Previous" button should disappear
        if (followPageNumber === 1) {
            followLoadPreviousButton.style.display = 'none';
        }

        // Calculate the current offset for the fetch request
        const currentPosition = (followPageNumber - 1) * 10;

        fetch(`/load_posts?offset=${currentPosition}`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                followPostsContainer.innerHTML = '';

                // Create new elements for each subsequent post
                data.following_posts.slice(0, 10).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'box';
                    postElement.setAttribute('data-follow-post-id', post.id);
                    postElement.innerHTML = `
                        <div class='post-box'>
                            <strong>
                                <a href="#" class="username-link" data-member="${post.user_id}">
                                    ${post.user}
                                </a>
                            </strong> | ${post.timestamp}
                            <p>${post.text}</p>
                            Likes: <span class='like-count'>${post.likes_count}</span>
                            <br>
                            <button class='like-unlike-button' data-follow-post-id='${post.id}'>
                                ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                            </button>
                            <div class="edit-post">
                                ${post.user_id === Number(currentUserId) ?
                            `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                            : ''
                        }
                            </div>
                        </div>
                        <div class='comments'>
                            <h5>Comments:</h5>
                            ${post.comments.length > 0 ? post.comments.map(comment => `
                                <div class='comment'>
                                    <strong>
                                        <a href="#" class="username-link" data-member="${comment.user_id}">
                                            ${comment.user}
                                        </a>
                                    </strong> | ${comment.timestamp}
                                    <p>${comment.text}</p>
                                </div>`).join('') : '<p>No comments yet.</p>'}
                            <textarea class='new-post-control' id='follow-post-comment' name='text' placeholder='Add commentary'></textarea>
                            <br>
                            <input type='submit' class='comment-submit-button' follow-comment-post-id='${post.id}' value='Comment'>
                        </div>
                    `;
                    followPostsContainer.appendChild(postElement);
                });

                // Scroll to the top of the posts container
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Update the loaded count
                followLoadNextButton.setAttribute('data-follow-posts-loaded', currentPosition);

                // Show the "Load Next" button if it was previously hidden
                followLoadNextButton.style.display = 'block';

            })
            .catch(error => console.error('Error loading previous posts:', error));
    });


    // Load the next ten posts (if they exist)
    followLoadNextButton.addEventListener('click', () => {
        // Increment the page number to determine the next offset
        followPageNumber += 1;

        // Fetch posts based on the current page number
        fetch(`/load_posts?offset=${(followPageNumber - 1) * 10}`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts before adding the new batch
                followPostsContainer.innerHTML = '';

                // Create new elements for each post in the batch
                data.following_posts.slice(0, 10).forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'box';
                    postElement.setAttribute('data-follow-post-id', post.id);
                    postElement.innerHTML = `
                        <div class='post-box'>
                            <strong>
                                <a href="#" class="username-link" data-member="${post.user_id}">
                                    ${post.user}
                                </a>
                            </strong> | ${post.timestamp}
                            <p>${post.text}</p>
                            Likes: <span class='like-count'>${post.likes_count}</span>
                            <br>
                            <button class='like-unlike-button' data-follow-post-id='${post.id}'>
                                ${post.liked_by_user ? '👍 Liked' : '👍 Like'}
                            </button>
                            <div class="edit-post">
                                ${post.user_id === Number(currentUserId) ?
                            `<button class="edit-post-button" data-post-id="${post.id}">Edit Post</button>`
                            : ''
                        }
                            </div>
                        </div>
                        <div class='comments'>
                            <h5>Comments:</h5>
                            ${post.comments.length > 0 ? post.comments.map(comment => `
                                <div class='comment'>
                                    <strong>
                                        <a href="#" class="username-link" data-member="${comment.user_id}">
                                            ${comment.user}
                                        </a>
                                    </strong> | ${comment.timestamp}
                                    <p>${comment.text}</p>
                                </div>`).join('') : '<p>No comments yet.</p>'}
                            <textarea class='new-post-control' id='follow-post-comment' name='text' placeholder='Add commentary'></textarea>
                            <br>
                            <input type='submit' class='comment-submit-button' follow-comment-post-id='${post.id}' value='Comment'>
                        </div>
                    `;
                    followPostsContainer.appendChild(postElement);
                });

                // Scroll to the top of the posts container
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Handle button visibility
                // Always show "Load Previous" after navigating forward
                followLoadPreviousButton.style.display = 'block';
                // Hide "Load Next" if fewer than 10 posts are returned
                if (data.following_posts.length < 11) {
                    followLoadNextButton.style.display = 'none';
                }
            })
            .catch(error => console.error('Error loading more posts:', error));
    });


    // NEW POST

    // Essentially all of this is just so that post submission will redirect to the All Posts page - remove if that functionality isn't desired

    document.getElementById('submit-post').addEventListener('click', function (event) {
        event.preventDefault();
        const form = event.target.closest('form');
        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData,
        })
            .then(response => {
                return response.text();
            })
            .then(() => {
                document.getElementById('new-post-body').value = '';
                document.getElementById('all-posts-link').click();
            })
            .catch(error => {
                console.error('Error submitting the post:', error);
                alert('An unexpected error occurred. Please try again.');
            });
    });


    // EDIT POST

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('edit-post-button')) {
            const post_id = event.target.getAttribute('data-post-id');

            fetch(`/edit_data/${post_id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        console.error('Error from server:', data.error);
                    } else {
                        const postData = data.edit_post_data;
                        const textArea = document.getElementById('edit-post-body');
                        textArea.value = postData.text;
                        const editButtonContainer = document.getElementById('edit-submit-button-container');
                        editButtonContainer.innerHTML = `
                        <button class="edit-post-submit" data-post-id="${post_id}">Update Post</button>
                    `
                        view_section('edit-post-view');
                        document.getElementById('edit-post-body').focus();
                    }
                })
                .catch(error => console.error('Error fetching the post:', error));
        }
    });


    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('edit-post-submit')) {
            const post_id = event.target.getAttribute('data-post-id');
            const updatedText = document.getElementById('edit-post-body').value;

            fetch(`/edit_post/${post_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ text: updatedText }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('all-posts-link').click();
                    } else {
                        console.error('Error updating post:', data.error);
                        alert(`Error: ${data.error}`);
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    })

});


// ALL SECTIONS
// Function to toggle visibility of the sections based on the selected one
function view_section(section_id) {
    // Array of section IDs to show/hide
    const sections = ['network-view', 'profile-view', 'all-posts-view', 'new-post-view', 'following-view', 'member-profile-view', 'edit-post-view'];

    sections.forEach(function (section) {
        if (section === section_id) {
            document.querySelector(`#${section}`).style.display = 'block';
        } else {
            document.querySelector(`#${section}`).style.display = 'none';
        }
    });
}