$(document).ready(function() {

	//get all available walks
	var walksURL = "https://smartwalks-test-proxy.herokuapp.com/http://smartwalks.cetools.org/api/v1/walk/"

	//array to get ID of walk
	var walkArr;
	var walkID;
	var walkDesc;

	//load walk details into DOM
	$.getJSON(walksURL, function(data) {
		walks = data['walks'];

		$.each(walks, function(i,v) {

			walkArr = walks[i].id.split("/");
			walkID = walkArr[2];
			walkDesc = walks[i].description;

			//add ID and description to session storage
			sessionStorage.setItem(walkID, walkDesc);

			if (walks[i].numberOfStops != 1) { 
				$('#walk-list').append(
					`<div class="card">
						<div class="card-body">
							<a href="./mapOverview.html?id=${walkID}&name=${walks[i].name}" class="stretched-link"><h2 class="card-title">${walks[i].name}</h2></a>
							<p class="card-subtitle">${walks[i].numberOfStops} stops</p>
						</div>
	      			</div>`);
			} else if (walks[i].numberOfStops == 1) {
				$('#walk-list').append(
					`<div class="card">
						<div class="card-body">
							<a href="./mapOverview.html?id=${walkID}&name=${walks[i].name}" class="stretched-link"><h2 class="card-title">${walks[i].name}</h2></a>
							<p class="card-subtitle">${walks[i].numberOfStops} stop</p>
						</div>
	      			</div>`);
			}
		});

		$('#loader').addClass('hidden');

	});

	//$(window).on('load', function(){
		//$('#loader').addClass('hidden');
	//});

});


	

