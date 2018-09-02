/* When the user clicks on the button, toggle between hiding and showing the dropdown content */

function showAccountDropDown() {
	document.getElementById("accountDropDown").classList.toggle("show");
}
function addNewProject() {
	$("#newprojectoption").slideToggle();
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
	if (!event.target.matches('.dropbtn2')) {
		var dropdowns = document.getElementsByClassName("dropdown-content2");
		var i;
		for (i = 0; i < dropdowns.length; i++) {
			var openDropdown = dropdowns[i];
			if (openDropdown.classList.contains('show')) {
				openDropdown.classList.remove('show');
			}
		}
	}
};

/* Set the width of the side navigation to 250px */
function openNav() {
	document.getElementById("mySidenav").style.width = "250px";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
	document.getElementById("mySidenav").style.width = "0";
}

document.querySelector('#new_project').addEventListener('click', function() {
	var newProject = {
		name: document.querySelector('.createproject').value
	}
	$.ajax({
		type: "POST",
		url: '/newproject',
		data: JSON.stringify(newProject),
		complete: function(resp) {
			window.location.href = resp.responseText;
		},
		dataType: 'json',
		contentType: 'application/json'
	});
});

window.data.forEach(function(project, i){
	var newproject = document.createElement('dl')
	var owner = `${project.owner.firstName} ${project.owner.lastName}`;
	newproject.innerHTML = `<table><tbody><tr><td class="project_name"><a href="/exproject/${project._id}">${project.name}</a></td><td class="project_owner">${owner}</td><td class="date_created">${new Date(project.dateCreated).toLocaleDateString()}</td></tr></tbody></table>`;
	newproject.className = i === 0 ? 'selected' : ''
	document.querySelector('#leftpanel').append(newproject)

	var projectdescription = document.createElement('p')
	projectdescription.innerHTML = `<p>${project.name}</p>`
})
