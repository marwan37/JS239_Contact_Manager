class ContactManager {
  constructor() {
    this.$list = $('#contacts-list');
    this.$noContacts = $('#no-contacts');
    this.$formDiv = $('#form-div');
    this.$tagsDiv = $('#tag-filter');
  
    this.bindEvents();
    this.compileTemplates();
    this.updateContacts();
  }

  async updateContacts() {
    this.contacts = await this.getAllContacts();
    this.searchManager = new SearchManager(this.contacts);
    this.searchManager.contactTmpl = this.contactTmpl;
    this.displayContacts(this.contacts);
  }

  sortContacts() {
    let btn = $('#sortContacts')[0];
    this.contacts.sort((a, b) => {
      if (btn.classList.contains('fa-arrow-up-a-z')) {
        return b['full_name'].localeCompare(a['full_name']);
      } else {
        return a['full_name'].localeCompare(b['full_name']);
      }
    })

    this.displayContacts(this.contacts);
    $('#sortContacts').toggleClass("fa-arrow-up-a-z");
    $('#sortContacts').toggleClass("fa-arrow-down-z-a");
  }

  bindEvents() {
    $('button#new-contact').on('click', this.showNewContactForm.bind(this));
    $('#contacts-list').on('click', this.handleEditOrDeleteClick.bind(this));
    $('#sortContacts').on('click', this.sortContacts.bind(this));
  }

  compileTemplates() {
    this.formTmpl = Handlebars.compile($('#formTemplate').html());
    this.contactTmpl = Handlebars.compile($('#contactTemplate').html());
    this.checkboxTmpl = Handlebars.compile($('#checkbox').html());

    Handlebars.registerHelper('formatPhone', pN => this.formatPhoneNumber(pN));
  }

  getContact() {
    return $.ajax(`api/contacts/${this.contactId}`, {
      method: "GET",
      dataType: "json"
    });
  }

  getAllContacts() {
    return $.ajax("/api/contacts", {
      method: "GET",
      dataType: "json"
    }).done(res => console.log('Successfully retrieved all contacts.'));
  }

  

  appendTags(contact) {
    if (!contact['tags']) { return; } 

    let $dd = $(`div#${contact['id']} dd.tags`);
    $dd.find('span.none').remove();

    contact['tags'].split(',').forEach(tag => {
      let span = document.createElement('span');
      span.textContent = `#${tag.toLowerCase()}`;
      span.classList.add('tag');
      span.addEventListener('click', e => {
        this.searchManager.filterContactsByTag(e);
      });
      $dd.append(span);
    })
  }

  displayContacts(contacts) {
    this.$list.html('');

    if (this.contacts.length === 0) {
      this.$noContacts.show();
    } else {
      this.$noContacts.hide();
      this.contacts.forEach(contact => {
        this.$list.append(this.contactTmpl(contact));
        this.appendTags(contact);
      })
      this.$list.show();
    }
    $('.inner-container.search').show();
  }

  hideContacts() {
    this.$list.hide();
    $('.inner-container').hide();
    this.$formDiv.show();
    this.$form = $('#main_form');
  }

  bindValidations() {
    let $inputs = $('input');
    $inputs.each(i => {
      let $input = $($inputs[i]);
      let $label;
      $input.on('focus', '.field', () => {
        if ($input.attr('id') === 'phoneInput') {
          $label = $('#phoneLabel')
        } else if ($input.attr('id') === 'countryInput') {
          $label = $('#countryLabel');
        } else {
          $label = $input.prev();
        }
        $label.text($label.data('name'));
        $label.removeClass('invalid');
        $input.removeClass('invalid');
        $('.form_errors').text('');
      });
      $input.on('focusout', () => this.validate($input));
      $input.on('keypress', this.validateKey);
    });
  }

  validateKey(e) {
    if ($(e.target).attr('name') === "full_name") {
      if (/[^a-z\s]/i.test(e.key)) { e.preventDefault(); }
    } else if ($(e.target).attr('name') === "phone_number") {
      if (/[^0-9\-\s]/.test(e.key)) { e.preventDefault(); }
    } else if ($(e.target).attr('name') === "country_code") {
      if (/[^0-9]/.test(e.key)) { e.preventDefault(); }
    }
  }

  validate($input) {
    if ($input.attr('name') === 'tags' || $input.attr('name') === 'country_code') {
      return;
    }

    let $label;

    if ($input.attr('name') === 'phone_number') {
      $label = $('#phoneLabel');
    } else {
      $label = $input.prev();
    }

    let labelName = $label.data('name');
    $label.text(labelName);

    if (!$input.val() && $input[0].required) {
      $label.text(labelName + " is a required field.");
    } else if ($input[0].validity.patternMismatch) {
      $label.text(`Please enter a valid ${labelName}.`);
    } 

    if ($label.text() !== labelName) { 
      $input.addClass('invalid');
      $label.addClass('invalid'); 
    } 
    else { 
      $input.removeClass('invalid'); 
      $label.removeClass('invalid'); 
    }
  }

  refreshTagManager(contactType, contact) {
    if (contactType === 'new') {
      this.tagManager = new TagManager();
    } else {
      if (contact['tags']) {
        let contactTags = contact['tags'].split(',');
        this.tagManager = new TagManager(contactTags);
      } else {
        this.tagManager = new TagManager();
      }
    }
    
    this.tagManager.countTags();
    if (this.tagManager.allTags.length === 0) {
      $('p.no_tags_message').css('display', 'block')
    } 
    
  }

  showNewContactForm() {
    this.$formDiv.html(this.formTmpl({type: 'Create'}));
    this.hideContacts();
    this.refreshTagManager('new', null)
    this.bindValidations();
    
    $('button.submit').on('click', this.handleFormSubmit.bind(this));
    $('button.cancel').on('click', this.handleCancelClick.bind(this));
  }

  async showEditForm() {
    let contact = await this.getContact();
    this.$formDiv.html(this.formTmpl({
      type: 'Edit',
      full_name: contact['full_name'],
      country_code: contact['phone_number'].slice(0, contact['phone_number'].length - 10),
      phone_number: contact['phone_number'].slice(contact['phone_number'].length - 10),
      email: contact['email'],
      tags: contact['tags']
    }));

    this.hideContacts();
    this.refreshTagManager('edit', contact);
    this.bindValidations();

    $('button.submit').on('click', this.handleFormSubmit.bind(this));
    $('button.cancel').on('click', this.handleCancelClick.bind(this));
  }

  handleFormSubmit(e) {
    e.preventDefault();
    if (this.$form[0].checkValidity()) {
      if ($('.contact-form h2').text().match(/Edit/)) {
        this.makeRequest('put', this.contactId);
      } else {
        this.makeRequest('post', null)
      }
    } else {
      $('#form-div').find('.form_errors').text('Please fix errors before submitting form.');
    }
  }

  async makeRequest(method) {
    $('#input-tag').val(this.tagManager.tags.join(','));
    let countryCode = $('#countryInput').val().replace(/[^\d]/g, '');
    let phoneNumber = $('#phoneInput').val().replace(/[\s-]/g, '');
    $('#phoneInput').val(countryCode + phoneNumber);

    let formData = this.getFormData();
    if (method === 'put'){
      await this.editContact(this.contactId, formData);
    } else {
      await this.createContact(formData);
      this.searchManager.contacts = this.contacts;
    }

    this.$formDiv.hide();
  }

  formatPhoneNumber(tel) {
    tel = tel.replace(/\-|\s/g, '');
    let code;
    if (tel.length > 10) {
      code = `+${tel.slice(0, tel.length - 10)} `;
    }
    tel = tel.slice(tel.length - 10)
    tel = `${code || ''}(${tel.slice(0, 3)}) ${tel.slice(3, 6)}-${tel.slice(6)}`;
    
    return tel;
  }

  handleCancelClick(e) {
    e.preventDefault();
    this.$formDiv.html('');
    this.$formDiv.hide();
    this.displayContacts(this.contacts);
  }

  async createContact(formData) {
    try {
      await $.ajax("/api/contacts/", {
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(formData),
        dataType: "json"
      })
      await this.updateContacts();
    } catch(err) {
      console.log(err)
    }
  }

  getFormData() {
    let $inputs = this.$form.find("input");
    let data = {};
    $inputs.each(idx => {
      data[$($inputs[idx]).attr("name")] = $($inputs[idx]).val();
    });

    return data;
  }

  async editContact(contactId, formData) {
    await $.ajax({
      url: `/api/contacts/${contactId}`, 
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(formData),
    }).done(function() {
       console.log("Success: Contact Updated!");
    }).fail(function() {
       console.log("An error occurred! " + err);
    });
    await this.updateContacts();
  }

  async deleteContact() {
    try {
      await $.ajax(`/api/contacts/${this.contactId}`, {
        method: "DELETE"
      });
      this.updateContacts();
    } catch(err) {
      console.log(err)
    }
  }

  handleEditOrDeleteClick(e) {
    e.preventDefault();
    let isEditBtn = e.target.classList.contains('edit');
    let isDeleteBtn = e.target.classList.contains('delete');
    this.contactId = e.target.dataset.id;

    if (isEditBtn) {
      this.showEditForm();
    } else if (isDeleteBtn) {
      let answer = confirm('Are you sure you want to delete this contact?');
      if (!answer) return;
      this.deleteContact();
    }
  }
}

class TagManager {
  constructor(tags = []) {
    this.$ul = $('ul');
    this.$input = $('#input-tag');
    this.$tagCount = $('span.count');
    this.maxTags = 5;
    this.tags = tags;
    this.refreshTags();
    this.bindModalEvents();
  }

  bindModalEvents() {
    this.$input.on('keydown', this.addTag.bind(this));

    $('#modalBtn').on('click', this.handleShowModalClick.bind(this));

    $('span.close').on('click', e => {
      e.preventDefault();
      $('#checkboxes').css('display', 'none');
    })

    window.onclick = function(e) {
      if ($(e.target)[0] === $('#checkboxes')[0]) {
       $('#checkboxes').css('display', 'none');
      }
    }
  }

  getAllTags() {
    this.allTags = this.tags.slice();
    contactManager.contacts.forEach(({tags}) => {
      if (tags) {
        tags.split(',').forEach(tag => {
          if (!this.allTags.includes(tag.trim())){
            this.allTags.push(tag.trim());
          }
        });
      }
    });
    return this.allTags;
  }

  countTags() {
    this.getAllTags().sort();
    this.updateCheckBoxes();
    this.$tagCount.text(this.maxTags - this.tags.length);
    if (this.tags.length === this.maxTags) {
      this.$input.attr('disabled', true)
      this.$input.attr('placeholder', 'Tag limit reached')
    } else {
      this.$input.attr('disabled', false);
      this.$input.attr('placeholder', 'Hit Tab or Enter after entering a tag name')
    }
  }

  removeTag(element, tag) {
    let tagIdx = this.tags.indexOf(tag);
    this.tags.splice(tagIdx, 1);
    element.remove();
    this.countTags();
  }

  refreshTags(){
    let ul = document.querySelector('ul');
    ul.querySelectorAll("li").forEach(li => li.remove());

    this.tags.slice().reverse().forEach(tag => {
      let liTag = document.createElement('li');
      liTag.textContent = tag.toLowerCase();
      let xIcon = document.createElement('i');
      xIcon.classList.add('fa-solid', 'fa-x');
      liTag.appendChild(xIcon);

      $(xIcon).on('click', () => this.removeTag(liTag, tag));
      ul.insertAdjacentElement('afterbegin', liTag);
    });

    this.countTags();
  }

  addTag(e){
    if (e.key == "Enter" || e.keyCode == 9) {
      e.preventDefault();
      let tag = e.target.value.replace(/\s+/g, ' ');
      if (tag.length > 1 && !this.tags.includes(tag)){
        if (this.tags.length < this.maxTags){
          this.tags.push(tag.toLowerCase());
          this.refreshTags();
        }
      }
      e.target.value = "";
    }
  }

  updateCheckBoxes() {
    $('#modalContent').find('label').each((_, label) => label.remove());

    if (this.allTags.length === 0) {
      $('p.no_tags_message').css('display', 'block')
    } else {
      $('p.no_tags_message').css('display', 'none')
    }

    this.allTags.forEach(tag => {
      if (!this.tags.includes(tag)) {
        $('#modalContent').append(contactManager.checkboxTmpl({tag}));
      } else {
        $('#modalContent').append(contactManager.checkboxTmpl({tag, isChecked: true}));
      }
    })

    $('#modalContent').find('input').on('click', this.handleCheckboxClick.bind(this));
  }

  handleCheckboxClick(e) {
    let tag = e.target.parentElement.textContent.trim();
    if (e.target.checked) {
      this.tags.push(tag);
      this.refreshTags();
      if (this.tags.length === this.maxTags) {
        this.disableCheckboxes();
      } 
    } else if (!e.target.checked && this.tags.includes(tag)) {
      let liTags = [...document.querySelectorAll('li')];
      let targetLi = liTags.filter(li => li.textContent === tag)[0];
      this.removeTag(targetLi, tag);
      this.enableCheckboxes();
    }
  }

  disableCheckboxes() {
    $('.tag_limit_message').slideDown('fast');
    $('input:checkbox:not(:checked)').attr('disabled', true)
    $('input:checkbox:not(:checked)').parent().addClass('disabled');
  }

  enableCheckboxes() {
    $('.tag_limit_message').slideUp('fast');
    $('label').removeClass('disabled');
    $('.form-control input').removeClass('disabled');
  }

  handleShowModalClick(e) {
    e.preventDefault();

    $('#checkboxes').css('display', 'block');
    if (this.tags.length === this.maxTags) {
      this.disableCheckboxes();
    } else {
      this.enableCheckboxes();
    }
  }
}

class SearchManager {
  constructor(contacts) {
    this.$search = $('.search-box input');
    this.contacts = contacts;
    this.tagsFilter = [];
    this.$list = $('#contacts-list');
    this.$tagsDiv = $('#tag-filter');
    this.$search.on('input', this.filterContacts.bind(this));
  }

  filterContacts(e) {
    let regex = new RegExp(`^${e.target.value}`, 'gi')
    this.matches = false;

    this.$list.html('');

    this.contacts.forEach(contact => {
      let [ firstName, lastName ] = contact['full_name'].split(' ');
      if (firstName && firstName.match(regex) || lastName && lastName.match(regex)) {
        if (this.tagsFilter.length === 0 || this.matchesTagFilters(contact['tags'])) {
          this.matches = true;
          this.$list.append(this.contactTmpl(contact));
          contactManager.appendTags(contact);
        } 
      }
    })

    if (!this.matches) {
      let p = document.createElement('p');
      p.textContent = `There are no contact names starting with ${e.target.value}.`;
      this.$list.append(p);
    }
  }

  matchesTagFilters(contactTags) {
    if (contactTags) {
      let tagsArr = contactTags.split(',');
      if (this.tagsFilter.length > 0) {
        return this.tagsFilter.every(tag => tagsArr.includes(tag));
      }
    }
  }

  updateTaggedContacts() {
    this.$list.html('');

    if (this.tagsFilter.length === 0) {
      this.$tagsDiv.hide()
      this.$search.trigger('input');
    } else {
      this.contacts.forEach(contact => {
        this.$search.trigger('input');
      });
    }
  }

  addSpanFilterEvent(span, tag) {
    let xIcon = document.createElement('i');
    xIcon.classList.add('fa-solid');
    xIcon.classList.add('fa-x');
    span.appendChild(xIcon);

    span.addEventListener('click', e => {
      let tagIdx = this.tagsFilter.indexOf(tag);
      this.tagsFilter.splice(tagIdx, 1);
      span.remove();
      this.updateTaggedContacts();
    })
  }

  filterContactsByTag(e) {
    if (this.$tagsDiv.is(':hidden')) this.$tagsDiv.show();
    let tag = e.target.textContent.slice(1);
    
    if (this.tagsFilter.includes(tag)) return;
    this.tagsFilter.push(tag)
    
    let span = document.createElement('span');
    span.textContent = tag;
    span.classList.add('tag');
    this.addSpanFilterEvent(span, tag);
    $('#filtersList').append(span);

    this.updateTaggedContacts();
  }
}

let contactManager = new ContactManager();
