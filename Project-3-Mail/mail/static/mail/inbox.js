document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', function() {
        load_mailbox('inbox');
        resetInactiveButtonStyle();
        setActiveViewButton(document.querySelector('#inbox'));
    });

    document.querySelector('#sent').addEventListener('click', function() {
        load_mailbox('sent');
        resetInactiveButtonStyle();
        setActiveViewButton(document.querySelector('#sent'));
    });

    document.querySelector('#archived').addEventListener('click', function() {
        load_mailbox('archive');
        resetInactiveButtonStyle();
        setActiveViewButton(document.querySelector('#archived'));
    });

    document.querySelector('#compose').addEventListener('click', function() {
        compose_email();
        resetInactiveButtonStyle();
        setActiveViewButton(document.querySelector('#compose'));
    });

    function setActiveViewButton(button) {
        button.style.backgroundColor = 'blue';
        button.style.color = 'white';
    }

    function resetInactiveButtonStyle() {
        const buttons = ['#inbox', '#compose', '#sent', '#archived', '#logout-button'];
        buttons.forEach(buttonId => {
            const button = document.querySelector(buttonId);
            button.style.backgroundColor = 'white';
            button.style.color = '#007bff';
        });
    }

    // Load inbox on page load
    document.querySelector('#inbox').click();
});


function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    // What to do when the email is sent; the user should be directed to the sent mailbox
    document.querySelector('#compose-form').onsubmit = function(event) {
        event.preventDefault();
        const recipients = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;

        // Indicate where the submitted data should go
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                console.log(result);
                alert('Email sent successfully.');
                load_mailbox('sent');
                
                // Update button styling to show the "sent" section
                document.querySelector('#inbox').style.backgroundColor = 'white';
                document.querySelector('#inbox').style.color = '#007bff';
                document.querySelector('#compose').style.backgroundColor = 'white';
                document.querySelector('#compose').style.color = '#007bff';
                document.querySelector('#sent').style.backgroundColor = 'blue';
                document.querySelector('#sent').style.color = 'white';
            }
        })
        .catch(error => console.error('Error:', error));
    };
}


function load_mailbox(mailbox) {
    console.log(`Loading mailbox: ${mailbox}`);

    // Show the mailbox and hide the other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Fetch emails for the specified mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch emails');
        }
        return response.json();
    })
    .then(emails => {
        if (emails.length === 0) {
            document.querySelector('#emails-view').innerHTML += '<p>No emails found.</p>';
        } else {
            const emailsView = document.querySelector('#emails-view');
            emails.forEach(email => {
                // Create a div for each email
                const emailDiv = document.createElement('div');
                emailDiv.className = 'email-item';
                if (document.querySelector('#emails-view').innerText === 'Sent') {
                    emailDiv.innerHTML = `
                        <strong>${email.recipients}</strong> - ${email.subject}
                        <span style="float: right;">${email.timestamp}</span>
                    `;
                } else {
                    emailDiv.innerHTML = `
                        <strong>${email.sender}</strong> - ${email.subject}
                        <span style="float: right;">${email.timestamp}</span>
                    `;
                }
                

                // Style the email item
                emailDiv.style.border = '1px solid #ddd';
                emailDiv.style.padding = '10px';
                emailDiv.style.margin = '5px 0';
                emailDiv.style.cursor = 'pointer';
                emailDiv.style.backgroundColor = email.read ? '#f0f0f0' : '#fff';

                // Add a click event to load the email
                emailDiv.addEventListener('click', () => load_email(email.id));

                // Append the email to the emails view
                emailsView.appendChild(emailDiv);
            });
        }
    })
    .catch(error => console.error('Error loading mailbox:', error));
}


function load_email(email_id) {
    console.log(`Loading email with id: ${email_id}`);  // Log for debugging

    // Fetch email details
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        console.log("Fetched email:", email);  // Log the email data for debugging

        const emailsView = document.querySelector('#emails-view');
        emailsView.innerHTML = '';  // Clear existing email content

        // Format email body
        let formattedBody = email.body
            .replace(/\n/g, '<br>')  // Convert line breaks to <br> tags
            .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));  // Convert multiple spaces to non-breaking spaces

        // Display email details
        emailsView.innerHTML = `
            <h3>${email.subject}</h3>
            <p><strong>From:</strong> ${email.sender}</p>
            <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
            <p><strong>Timestamp:</strong> ${email.timestamp}</p>
            <hr>
            <p>${formattedBody}</p>
            <hr>
        `;


        // Add "Reply" button
        const replyButton = document.createElement('button');
        replyButton.className = 'btn btn-sm btn-outline-primary';
        replyButton.style.marginRight = '10px';
        replyButton.style.marginBottom = '10px';
        replyButton.innerHTML = 'Reply';
        replyButton.addEventListener('click', () => {
            compose_email();
            document.querySelector('#compose-recipients').value = email.sender;
            document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            document.querySelector('#compose-body').value = `\n\n------------------------------------------------------------------------------------------------------------------------------------------------------\nFrom: ${email.sender}\nTo: ${email.recipients}\nTimestamp: ${email.timestamp}\n\n${email.body}`;
        });
        emailsView.appendChild(replyButton);


    // Add button to archive or unarchive emails
    const archiveButton = document.createElement('button');
    archiveButton.className = 'btn btn-sm btn-outline-primary';
    archiveButton.style.marginBottom = '10px';
    archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
    archiveButton.addEventListener('click', () => {
        fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
        })
        // Adjust this next part if you want to change to which mailbox you are directed upon archive or unarchive
        location.reload();
        
        /*
        // Use the following code if you want the archive mailbox to load when the mail is archived, or the inbox to load if it's unarchived
        .then(() => {
            // Check if the button's text is 'Archive' or 'Unarchive'
            if (archiveButton.innerHTML === 'Archive') {
                load_mailbox('archive');
                document.querySelector('#archived').style.backgroundColor = 'blue';
                document.querySelector('#archived').style.color = 'white';
                document.querySelector('#inbox').style.backgroundColor = 'white';
                document.querySelector('#inbox').style.color = '#007bff';
                document.querySelector('#sent').style.backgroundColor = 'white';
                document.querySelector('#sent').style.color = '#007bff';
            } else {
            load_mailbox('inbox');
                document.querySelector('#inbox').style.backgroundColor = 'blue';
                document.querySelector('#inbox').style.color = 'white';
                document.querySelector('#archived').style.backgroundColor = 'white';
                document.querySelector('#archived').style.color = '#007bff';
                document.querySelector('#sent').style.backgroundColor = 'white';
                document.querySelector('#sent').style.color = '#007bff';
            }
        });
        */
    });
    emailsView.appendChild(archiveButton);



        // Mark email as read
        fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({ read: true })
        })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to mark email as read');
            }
        })
        .catch(error => console.error('Error marking email as read:', error));
    })
    .catch(error => console.error('Error loading email:', error));
}
