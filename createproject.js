/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

var quill = new Quill('#editor-container', {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],

      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent                   // text direction

      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],

      ['clean']
    ]
  },
  placeholder: 'What should you post?',
  theme: 'snow' // or 'bubble'
});
//# sourceURL=pen.js

function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $('#logo')
      .attr('src', e.target.result)
      .width(200)
      .height(200);
    };

    reader.readAsDataURL(input.files[0]);
  }
}

// Updates to projects page
function bindData() {
	document.querySelector('#projectname').value = window.data.name;
    document.querySelector('.ql-editor').innerHTML = window.data.description;
    document.querySelector('#logo').src = window.data.logo;
}

//bindData();

document.getElementById('save').addEventListener('click', save);

function save(data) {
  var req = new XMLHttpRequest();
  req.open('POST', '/newproject', true);
  req.setRequestHeader('content-type', 'application/json');
  // Alert the user to any errors from the server

  function readyStateChange() {
    if(req.readyState !== 4) return;
    if(req.status !== 200) return;
    var body = JSON.parse(req.responseText);
    if(body.error) {
      return alert(body.error);
    }
    //window.location.href = '/game';
    }
  req.onreadystatechange = readyStateChange;
  req.send(JSON.stringify(data));
}

document.getElementById('cancel').addEventListener('click', cancel);

function cancel() {
  window.location.href = '/dashboard/' + window.data._id;
}
