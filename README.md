# J239 Practice Project - Contact Manager

## Initial Setup
- Clone repository
- Navigate and open terminal at root  of project folder
- Run `npm install` to install dependencies
- Run `npm start` to start the API server
- Navigate to `http://localhost:3000` on your browser

## Project description
- This is a single-page web app with dynamically displayed views from the root url:
	1. Home page displays the new contact button, search box, sort button, and all contacts.
	2. New Contact Form or Edit Contact Form (same Handlebars template)
	3. Modal that shows all available tags to select from
- There are 3 classes in total:
	1. `ContactManager`:  
		- Manages functionality related to adding, editing and deleting contacts.
		- Dynamically displays and hides the root view, forms and contacts.
		- Contains an instance of `TagManager` and `SearchManager`.
	2. `TagManager`: Manages the tag input box, modal, and keeps track of all tags (from all contacts)
	3. `SearchManager`: Manages functionality related to filtering contacts by name, by tags, or both.

## Home Page
- Add contact button, search bar, and button to sort contacts (ascending & descending)
- If there are no contacts, a message displaying so will appear.
- Each displayed contact will have their full information displayed in addition to clickable tags (if any)
- Clicking a tag from any contact box will filter contacts that share that tag and display it above the container holding all the contacts.
- Clicking multiple tags will filter contacts that share *all* of the tags shown.
- Clicking on any tag from the tag filters list (shown above the contacts container) will remove the filter for that tag.
- Each contact has an edit and delete button.

## Forms
- Clicking the "New Contact" button will render the new contact form
- Clicking the "Edit" button for a specific contact will render the edit contact form

## Modal and Tags
- Clicking on the `Tag Selector` button will render a modal that allows you to select which tags to append to the current contact. 
- A maximum of 5 tags are allowed per contact.
- Once a contact has 5 tags, the checkboxes in the modal are disabled with a message saying that you've reached the maximum number of tags allowed for this contact.
- Tags can also be added using the input box. Press 'Enter' or 'Tab' after each tag name to add it.

## Search and Tag Filters
- Search box allows you to filter contacts by first name or last name.
- For example, if the search query is `s` then all contacts that have a first or last name starting with `s` will be shown.
- If the search query is `s` and a tag filter is also present, then all contacts matching `s` *and* the tag filters will be shown.
