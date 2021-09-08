window.onload = () => { 

	loadPlace();

    //event listener for button
    $('body').on('click', '#info-btn', function(){
    	$('#instructions').addClass('hide');
    	$('#overlay').removeClass('hide');
    });

    //close iframe
    $('#close-frame').click(function(){
    	parent.closeIFrame();
    });

};

//ADDS A-IMAGE ELEMENT AND OVERLAY WITH PLACE INFO TO PAGE
function loadPlace() {
    
    let urlParams = new URLSearchParams(document.location.search);
    var placeID = urlParams.get('id');

    var fullPlaces = JSON.parse(sessionStorage.getItem('places'));

    var data = fullPlaces.features[placeID].properties;

    console.log(data);	
    console.log(data.location);

    //create image element
    let lat = data.location._latitude;
   	let lon = data.location._longitude;
   	const scene = document.querySelector("a-scene");

   	const img = document.createElement("a-image");
   	img.setAttribute('src', '../img/map_icon_orange.png');
   	img.setAttribute('scale', {
    	x: 0.5, 
    	y: 0.5,
    	z: 0.5
    });
    img.setAttribute('look-at', '[gps-camera]');
    img.setAttribute('gps-entity-place', {
    	latitude: lat, 
    	longitude: lon
    });
    	

    img.addEventListener('loaded', () => {
        window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
     });

    scene.appendChild(img);

    //CREATE OVERLAY
    var content = document.createElement('div');
    content.setAttribute('class', 'hide');
	content.setAttribute('id', 'overlay');

	        //close button
	var closeBtn = document.createElement('i');
	closeBtn.setAttribute('class', 'fa fa-times-circle');
	closeBtn.setAttribute('id', 'btn-close');
	content.appendChild(closeBtn);

	        //create text
	var placeText = document.createElement('div');
	placeText.setAttribute('id', 'text');
	var textTitle = document.createElement('h1');
	textTitle.innerText = data.name;
	var textDesc = document.createElement('p');
	textDesc.setAttribute('id', 'desc');
	textDesc.innerText = data.description;
	placeText.appendChild(textTitle);
	placeText.appendChild(textDesc);

	content.appendChild(placeText); //add to overlay

	        //create buttons
	var buttonMenu = document.createElement('div');
	buttonMenu.setAttribute('id', 'buttons');
	buttonMenu.innerHTML = `<span class="material-icons" id="info">info</span>
	                  <span class="material-icons" id="quiz">quiz</span>
	                  <span class="material-icons" id="reading">article</span>`

	content.appendChild(buttonMenu);

	document.body.appendChild(content);

	        //QUIZ QUESTIONS
	var questions = data.questions;
	var questionsList = document.createElement('ol');

	$.each(questions, function(i) {
	     let q = document.createElement('li');
	     q.innerText = questions[i];
	     questionsList.appendChild(q);
	 });

	              //event listener for quiz questions
	$('#quiz').click(function(){
	    textTitle.innerText = 'Questions';
	    $('#desc').hide();
	    placeText.appendChild(questionsList);
	 });

	              //event listener for info
	$('#info').click(function(){
	    if (placeText.contains(questionsList)) {
	        placeText.removeChild(questionsList);
	        $('#desc').show();
	    }
	    textDesc.innerText = data.description;
	    textTitle.innerText = data.name;
	});

	              //event listener for further reading
	$('#reading').click(function(){
	    if (placeText.contains(questionsList)) {
	        placeText.removeChild(questionsList);
	        $('#desc').show();
	    }
	    textDesc.innerText = data.link;
	    textTitle.innerText = 'Further reading';
	});

	    //event listener for close icon
	$('#btn-close').click(function(){
	    $('#overlay').addClass('hide');
	});

	    //add button and text divs
	$('.centered').append(`<div id="instructions"><p>Find the orange place icon, then line it up with the centre button and tap to reveal information</p></div>
      <button id="info-btn" data-action="change"></button>`);


};


