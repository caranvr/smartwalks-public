$(document).ready(function() {

  //back to previous page
  $("#nav-top__back").click(function(){
    // alert("Succuessfully back to last step!");
    window.history.back();
  });

  // add a function to extract the id of place later, below is just an example
  var pid = "4CuSdZPANw7CUtdEjMEL";

  var url = makeURL(proxyURL = "https://cors-anywhere.herokuapp.com/", baseURL = "https://smartwalks.cetools.org/api/", version = "v1", type = "place", pid, format = "");
  console.log(url);

  $.getJSON(url, function(data) {

    // image to display
    var imgSize = "detail";
    var imgURL = "https://smartwalks.cetools.org/img/"+ "example" + "_" + imgSize + ".png";
    // change "example" to pid later after renaming img in database
    console.log(imgURL);
    $(".place__img").attr({
      "src": imgURL
    });

    // place attributes extraction
    // category
    var category = data.category;
    console.log(category);
    var catColor = getCatColor(category);
    console.log(catColor);
    $(".place__nonvisual-attr-category").text(category);
    $(".place__nonvisual-attr-category").css("background",catColor);

    // hashtags
    var hashtagsArr = data.hashtags.split(",");
    $.each(hashtagsArr, function(i,v){
      var newHashtag = '<button class="btn place__nonvisual-attr-hashtags-item mr-1" type="button">#'+ v + '</button>'
      $(".place__nonvisual-attr-hashtags").append(newHashtag);
    });

    // creator

    // place name
    $(".place__nonvisual-title-name").text(data.name);
    // data portal
    $(".place__nonvisual-title-link").attr({
      "href": data.link
    }).click(function(){
      $(this).css("color",catColor)
    });
    // place description
    $(".place__nonvisual-description").text(data.description);

    // questions and answers
    var numQuestions = data.questions.length;
    console.log("There are " + numQuestions + " questions.");

    $.each(data.questions, function(i, v) {
      var newCard = '<div class="card place__nonvisual-questions-card"></div>'
      $("#place__nonvisual-questions").append(newCard);

      $(".place__nonvisual-questions-card").last().html('<div class="card-header place__nonvisual-questions-card-header"><button type="button" class="collapsed place__nonvisual-questions-card-header-question text-left" data-toggle="collapse"><i class="fa fa-plus"></i></button></div><div class="collapse place__nonvisual-questions-card-collapse" data-parent="#place__nonvisual-questions"><div class="card-body place__nonvisual-questions-card-collapse-answer"></div></div>');

      var questionId = "question" + i;
      console.log(questionId);
      console.log(v.question);
      var answerId = "answer" + i;
      console.log(answerId);
      $(".place__nonvisual-questions-card-header").last().attr({
        "id": questionId
      });
      $('.place__nonvisual-questions-card-header-question').last().attr({
        "data-target": "#" + answerId
      });
      $(".place__nonvisual-questions-card-collapse").last().attr({
        "id": answerId,
        "aria-labelledby": questionId
      });

      $(".place__nonvisual-questions-card-header-question").last().append("<b> " + v.question + "</b>");
      $(".place__nonvisual-questions-card-collapse-answer").last().append("<p>" + v.answer + "</p>");

      // Toggle plus minus icon on show hide of collapse element
      $(".collapse")
        .on('show.bs.collapse', function() {
          $(this).prev(".card-header").find(".fa").removeClass("fa-plus").addClass("fa-minus");
        })
        .on('hide.bs.collapse', function() {
          $(this).prev(".card-header").find(".fa").removeClass("fa-minus").addClass("fa-plus");
        });

    });

  });

});

// FUNCTIONS
// generate url to get data
function makeURL(proxyURL = "https://cors-anywhere.herokuapp.com/", baseURL = "https://smartwalks.cetools.org/api/", version = "v1", type = "place", pid, format = "") {
  var url = proxyURL + baseURL + version + "/" + type + "/" + pid + "/" + format;
  return url;
};

// get the color for specific category
function getCatColor(category) {
  var clPalette = {
    "healthcare":"#B40156",
    "transport":"#FBBB00",
    "energy":"#00A0B8",
    "education":"#645070"
  };
  var catColor = clPalette[category];
  return catColor;
};

// go back to last step
function goBack() {
  window.history.back();
};
